import { defineStore } from 'pinia'
import { polyline, type CoordTuple } from '@/lib/polyline'
import { simplifyPath } from '@/lib/douglasPeucker'
import { hubeny } from '@/lib/hubeny'
import { HubenyCorrection, weighedThreshold } from '@/config.js'

import { useGmapStore } from '@/stores/GmapStore.js'
import { useCuesheetStore } from './CueSheetStore'
import { RoutePoint } from '@/classes/routePoint'

import axios from 'axios'
import _ from 'lodash'

// weight = 20 を voluntary point（キューポイント） につける
const simplifyParam = [
    { weight: 2, tolerance: 0.00001 },
    { weight: 3, tolerance: 0.000015 },
    { weight: 5, tolerance: 0.00005 },
    { weight: 7, tolerance: 0.0002 },
    { weight: 9, tolerance: 0.0005 },
    { weight: 10, tolerance: 0.0007 }
]

const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type State = {
    points: RoutePoint[],
    idMap: Map<Symbol, number>,  // id→index の対応（検索の高速化のため）
    subpath: {
        begin: number | null,
        end: number | null
    }
    subpathTemp: {  // マップ上のポイント操作でもサブパスを調整できるように
        begin: number | null,
        end: number | null
    }
    subpathTempPath: Array<{ lat: number, lng: number }>
    subpathDirectionControlPoints: Array<{ lat: number, lng: number }>,
    cacheDemTilesTs: number, // cacheDemTiles を重複呼び出ししないようにするタイムスタンプ
}

type BrmRange = { begin: number, end: number }

/**
 * 編集可能範囲の指定
 */
type Editable = { begin: number, end: number, points: RoutePoint[], editable: boolean, id: symbol }
type EditableRanges = Editable[]

/**
 * slider でやりとりするインデックス
 */
type SubpathIndex = [number | null, number | null]

// SubpathIndex の変化に応じて getter で変化
type Subpath = {
    begin: number | null
    end: number | null
    points: RoutePoint[]
    count: number
    head: boolean   // 先頭部分にひげが必要か（パスの途中にサブパス）
    tail: boolean   // 終点部分にひげが必要か
    editable: boolean   // 編集モードか
    id: symbol
}

export const useBrmRouteStore = defineStore('brmroute', {

    state: (): State => ({
        points: [],
        idMap: new Map(),
        subpath: {
            begin: null,
            end: null
        },
        subpathTemp: {
            begin: null,
            end: null
        },
        subpathTempPath: [], // 確定前のサブパスのポイントを入れておく
        subpathDirectionControlPoints: [],   // 確定前の direction service の経由点を入れておく
        cacheDemTilesTs: 0,  // 呼び出し時の timestamp を保持。 timeout 時間を考慮。"0"は使用中でない。
    }),

    getters: {
        /** ポイント数 */
        count: (state): number => state.points.length,

        /** BRM範囲（両端の除外を考慮） */
        brmRange(state): BrmRange {
            let begin = -1
            let end = this.count
            for (let i = 0; i < this.count; i++) {
                if (!state.points[i].excluded) {
                    begin = i
                    break
                }
            }
            for (let i = this.count - 1; i >= 0; i--) {
                if (!state.points[i].excluded) {
                    end = i
                    break
                }
            }
            return { begin, end }
        },

        /** ルート距離（除外を含む） */
        routeDistance: (state): number => state.points.length > 0 ? state.points.slice(-1)[0].routeDistance : 0,

        /** ブルベ距離 */
        brmDistance(state): number | undefined {
            if (state.points.length === 0) return undefined
            const range = this.brmRange
            return state.points[range.end].brmDistance
        },

        /** 最大標高
         * Profile Map の目盛りに使うのでデフォルト値を 1000m とした。
        */
        brmHighestAltitude(state): number {
            if (state.points.length === 0) return 1000
            return state.points.reduce((prevAlt: number, pt: RoutePoint) => {
                return pt.excluded ? prevAlt : (!pt.alt ? prevAlt : Math.max(prevAlt, pt.alt))  // Math.max() に undefined が渡ると NaN が返る
            }, -Infinity)
        },

        /** simplify 用の配列（x,y,z) を用意
         * ・拡張して path encode にも使えるようにした
         * ・さらに標高キャッシュに送る用に、キャッシュ済みかを含めた
         */
        pointsArray: (state) => state.points.map((pt, index) => ({ x: pt.lng ?? 0, y: pt.lat ?? 0, z: pt.alt ?? -1000, index, demCached: pt.demCached })),

        /** encodedPathAlt は常時更新する必要がないので関数型 getter にしておく */
        encodedPathAlt(state) {
            return () => {
                const latLngAlt: CoordTuple[] = this.pointsArray.map((pt) => ([pt.y, pt.x, pt.z]))
                return polyline.encode(latLngAlt)
            }
        },

        pointsBeyondWeight: (state) => (weight: number): RoutePoint[] => {
            if (!state.points) return []

            return state.points.filter(pt => pt.weight >= weight)
        },

        /** ある程度以上のポイント */
        availablePoints(state): RoutePoint[] {
            const editable = this.editableIndex
            if (editable[0] === null || editable[1] === null) return []

            const gmapStore = useGmapStore()
            const subpathMode = gmapStore.subpathMode
            const zoom = gmapStore.zoom ?? 9

            const threshold = Math.min(20, (subpathMode ? 17 : 22) - zoom)

            const begin = subpathMode ? state.subpath.begin : editable[0]
            const end = subpathMode ? state.subpath.end : editable[1]

            const _points = state.points
                .slice(begin! + 1, end!)
                .filter(pt => pt.weight >= threshold)

            _points.push(state.points[begin!], state.points[end!]) // 両端は閾値にかからなくても加える
            return _points.filter(pt => gmapStore.latLngBounds?.contains(pt))

        },

        /** serialize / unserialize 用の配列 */
        serializablePoints(state) {
            const arr: Array<{ excluded: boolean, weight: number }> = []
            state.points.forEach((pt) => {
                const excluded = pt.excluded
                const weight = pt.weight
                arr.push({ excluded, weight })
            })
            return arr
        },

        /** pack() / unpack() 用 */
        pointProperties(state) {
            return () => {
                const excluded = state.points.map((pt: RoutePoint) => pt.excluded ? 1 : 0)
                const weight = state.points.map((pt: RoutePoint) => pt.weight)
                const demCached = state.points.map(pt => pt.demCached ? 1 : 0)
                return { excluded, weight, demCached }
            }
        },

        /**
         * Polyline 用に抽出するポイントの配列を返す（引数付き getter）
         * 開始・終了は weight 関係なしに設定し、その間は weight の高いポイントを返す
         * @param begin {number}
         * @param end {number}
         * @returns 
         */
        getPolylinePoints: (state) => (begin: number, end: number, threshold: number = weighedThreshold) => {
            const arr: RoutePoint[] = []

            if (begin > end) {
                return arr
            }

            arr.push(state.points[begin])
            for (let i = begin + 1; i < end; i++) {

                const pt = state.points[i]
                if (pt.weight >= threshold) {
                    arr.push(pt)
                }

            }
            arr.push(state.points[end])
            return arr
        },

        /** point id からルートポイントを返す
         *  ID が null のとき（POIのとき）は undefine
         */
        getPointById: (state) => (id: symbol | null) => {
            if (id === null) return undefined
            const idx = state.idMap.get(id)
            return state.points[idx!]
        },

        /** point の インデックスを返す */
        getPointIndex: (state) => (pt: RoutePoint) => {
            return state.idMap.get(pt.id) as number
        },

        /** point id からインデックスを返す */
        getPointIndexById() {
            return (id: symbol | null) => {
                const point = this.getPointById(id)
                return point ? this.getPointIndex(point) : null
            }
        },

        /**
         * (getter) 除外範囲の開始と終了の各インデックスを求める
         * リアクティブに polyline を書き換えてもらうために unique ID を Symbol() で振る
         * polyline で表示するために exclude でない両端を含める
         * @returns Array<{ begin, end, id: Symbol()}>
         */
        excludedRanges(state) {
            const arr = [] as Array<{
                begin: number | null, end: number | null
            }>

            let begin: number | null = null
            let end: number | null = null
            for (let i = 0; i < this.count; i++) {
                const pt = state.points[i]
                if (pt.excluded === true) {
                    if (begin === null) {
                        begin = i
                    }
                    end = i
                } else {
                    if (begin !== null) {
                        arr.push({ begin, end })
                        begin = null
                        end = null
                    }
                }
            }
            if (begin !== null && end !== null) {
                arr.push({ begin, end })
            }

            // 除外区間がない場合
            if (arr.length === 0) { return arr }

            return arr.map((range) => {

                const _begin = Math.max(range.begin! - 1, 0)
                const _end = Math.min(range.end! + 1, this.count - 1)

                const points = this.getPolylinePoints(_begin, _end) as RoutePoint[]
                return ({ begin: _begin, end: _end, points, id: Symbol() })
            })
        },
        /**
         * 編集範囲のインデックスを返す
         */
        editableIndex(state) {
            // 編集可能範囲（除外と違って範囲は一つだけ）
            let begin: number | null = null
            let end: number | null = null
            for (let i = 0; i < this.count; i++) {
                const pt = state.points[i]
                if (pt.editable === true) {
                    if (begin === null) {
                        begin = i
                    }
                    end = i
                }
            }
            return [begin, end]
        },


        /**
         * 基本的なパスの Polyline を描画するためのポイントリストを返す
         * 編集範囲 begin - end の前後を含め最大 3つの要素 Editable を作成するが、存在しないときは返さない。
         * 再描画を促すために id に Symbol() を振る
         * @param state 
         * @returns 
         */
        editableRanges(state): EditableRanges {

            const [begin, end] = this.editableIndex

            const arr = []

            // pre
            if (begin !== 0) {
                const pre: Editable = { begin: 0, end: begin!, points: this.getPolylinePoints(0, begin!), editable: false, id: Symbol() }
                arr.push(pre)
            }
            // editable
            const editable: Editable = { begin: begin!, end: end!, points: this.getPolylinePoints(begin!, end!), editable: true, id: Symbol() }
            arr.push(editable)
            // post
            if (end !== this.count - 1) {
                const post: Editable = { begin: end!, end: this.count - 1, points: this.getPolylinePoints(end!, this.count - 1), editable: false, id: Symbol() }
                arr.push(post)
            }
            return arr as EditableRanges
        },

        /**
                 * サブパス範囲のインデックスを返す
                 * el-slider で使えるように [begin, end] の配列（タプル）を返す
                 * @param state 
                 * @returns 
                 */
        subpathIndex(state): SubpathIndex { return [state.subpath.begin, state.subpath.end] },

        /**
         * サブパス描画用のポイント一覧を返す
         * サブパスは最低 5ポイントないと成立しない ことにする
         * @param state 
         * @returns 
         */
        subpathRange(state): Subpath {

            const gmapStore = useGmapStore()

            const begin = state.subpath.begin
            const end = state.subpath.end
            const editable = gmapStore.subpathEditMode
            let head: boolean = false
            let tail: boolean = false

            let points: RoutePoint[] = []

            if (begin !== null && end !== null && end - begin >= 4) {
                if (begin > 0) {
                    head = true
                }
                if (end < this.count - 1) {
                    tail = true
                }
                points = this.getPolylinePoints(begin, end, 1)
            }

            return { begin, end, points, count: points.length, head, tail, editable, id: Symbol() }
        },

        /**
         * （引数つきgetter）
         * @params position: google.maps.LatLng
         * @returns RoutePoint | null
         */
        getClosePoint() {

            type ClosePoint = {
                pt: RoutePoint | null,
                dist: number
            }

            const deviateThreshold: number = 0.001

            return (position: google.maps.LatLng) => {

                const posLat = position.lat()
                const posLng = position.lng()

                const candidate = this.availablePoints.filter((pt: RoutePoint) => {

                    if (pt.editable === false || pt.excluded === true) {
                        return false
                    }

                    const deviate = Math.abs(pt.lat - posLat) + Math.abs(pt.lng - posLng)
                    if (deviate > deviateThreshold) return false

                    return true
                })

                if (candidate.length === 0) return null

                const closest: ClosePoint = candidate.reduce((_closest: ClosePoint, pt: RoutePoint) => {

                    const _distance = hubeny(posLat, posLng, pt.lat, pt.lng)
                    if (_distance < _closest.dist) {
                        return { pt, dist: _distance }
                    } else {
                        return _closest
                    }

                }, { pt: null, dist: Infinity })

                return closest.pt as RoutePoint
            }

        },
        /**
         * 指定距離の緯度・経度を返す
         * （route direction で参照点を求めるのに使用）
         * distance が範囲内に収まっていない場合は、折り返した点を終端を支点に反転させた点を返す
         * 道路検索や、進路検索で端の方での計算に用いるため
         * @params distance: number routeDistance
         * @returns { lat: number, lng: number}
         */
        getLocationByDistance(state) {

            // fulcrum を支点とする対称点を返す
            const getMirror = (pt: { lat: number, lng: number, isMirror?: boolean }, fulcrum: { lat: number, lng: number }, isMirror: boolean) => {
                return { lat: 2 * fulcrum.lat - pt.lat, lng: 2 * fulcrum.lng - pt.lng, isMirror }
            }

            // getMirror() を使ったかのフラグ
            let isMirror: boolean = false

            return (
                (distance: number): { lat: number, lng: number, isMirror: boolean } => {

                    if (distance < 0) {
                        if (-distance < this.routeDistance) {
                            isMirror = true
                            return getMirror(this.getLocationByDistance(-distance), this.points[0], isMirror)
                        } else {
                            throw new Error('invalid distance: 手前すぎ')
                        }
                    }

                    if (distance > this.routeDistance) {
                        if (distance < 2 * this.routeDistance) {
                            isMirror = true
                            return getMirror(this.getLocationByDistance(2 * this.routeDistance - distance), this.points.slice(-1)[0], isMirror)
                        } else {
                            throw new Error('invalid distance: 行き過ぎ')
                        }
                    }

                    let i = 0
                    for (; i < this.count; i++) {
                        if (state.points[i].routeDistance > distance) {
                            break
                        }
                    }
                    i--
                    const diffLat = state.points[i + 1].lat - state.points[i].lat
                    const diffLng = state.points[i + 1].lng - state.points[i].lng
                    const prop = (distance - state.points[i].routeDistance) / (state.points[i + 1].routeDistance - state.points[i].routeDistance)

                    return ({ lat: state.points[i].lat + diffLat * prop, lng: state.points[i].lng + diffLng * prop, isMirror })
                })
        },

        /**
         * RoutePoint id: symbol の一覧
         * CueSheetStore で routepoint id の振り直しに利用
         */
        idList(state): symbol[] {
            return state.points.map(pt => pt.id)
        },

        /**
         * RoutePoint に CuePoint が設定されているか
         * 一つのRoutePointにはCuePointは一つしか設定できない
         * @returns { point: CuePoint, id: symbol } | null
         */
        hasCuePoint(state) {
            const cuesheetStore = useCuesheetStore()
            return (pt?: RoutePoint | number | null) => {
                if (pt === null || pt === undefined) return null

                const routePoint = (typeof pt === 'number') ? state.points[pt] : pt

                const cpt = cuesheetStore.getArray.find((cpt) => {
                    return cpt.routePointId === routePoint.id
                })
                return cpt ? { point: cpt, id: cpt.id } : null
            }
        },

        getHeading() {
            return (pt: RoutePoint | undefined, distance: number = 50) => {

                if (pt === undefined) {
                    return { in: 0, out: 0, heading: 0 }
                }

                const dev = 50
                const front = this.getLocationByDistance(pt.routeDistance - dev)
                const beyond = this.getLocationByDistance(pt.routeDistance + dev)
                const inAngle = google.maps.geometry.spherical.computeHeading(front, pt)
                const outAngle = google.maps.geometry.spherical.computeHeading(pt, beyond)

                return { in: inAngle, out: outAngle, heading: (outAngle - inAngle + 360) % 360 }

            }
        },

        // debug用
        weightList(state) {
            const weight = [1, 2, 3, 5, 7, 9, 10, 20]
            const list: Array<{ weight: number, count: number }> = []
            for (const wt of weight) {
                const count = state.points.filter(pt => pt.weight >= wt).length
                list.push({ weight: wt, count })
            }
            return list
        }

    },

    actions: {
        /** encoded Path を与えて初期化する */
        setPoints(path: string) {

            const _points = polyline.decode(path)

            this.$patch((state) => {
                state.points = [...(_points.map((pt) => {
                    return new RoutePoint(pt.lat, pt.lng, pt.alt ?? undefined)
                }))]
            })

            this.update()
        },

        /**
         * 諸々の操作をしたあとにパスの状態を適切にする
         */
        update() {

            const cuesheetStore = useCuesheetStore()

            // 
            this.setIdMap()

            // ポイントウエイトを設定
            this.setWeight()

            // 距離を計算
            this.setDistance()

            // キューポイントの update
            cuesheetStore.update()

            // 標高獲得用の DEM タイルを予めサーバーにキャッシュしておく
            this.cacheDemTiles()

        },

        setIdMap() {
            this.$patch({
                idMap: new Map(this.points.map((pt, index) => ([pt.id, index])))
            })
        },

        /**
         * ポイントウエイトの設定
         *  パラメータに従って重み付けしてマーカーを付けるかどうかを決定する
         *  max 20（キューポイント設定点や任意設定点につける）
         *  min 1
         */
        setWeight() {

            for (const condition of simplifyParam) {
                const tolerance = condition.tolerance
                const weight = condition.weight
                const _result = simplifyPath(this.pointsArray, tolerance)

                _result.forEach(pt => {
                    const index = pt.index
                    this.points[index].weight = Math.max(this.points[index].weight, weight)
                })
            }

        },
        /**
         * ポイントの距離を設定する
         *  Hubeny 計算のコストを考えて hubeny の計算範囲を指定できるようにする
         * 
         * begin hubeny 計算の開始ポイント（index）
         * end 同終了ポイント
         */
        setDistance(begin = -Infinity, end = Infinity) {

            const _begin = Math.max(1, begin)
            const _end = Math.min(end + 1, this.count - 1)

            if (_end < _begin) {
                throw new Error('setDistance: 開始点が終了点よりあとになっています')
            }

            this.$patch((state) => {
                // 先頭ごと入れ替わったときへの対応
                state.points[0].pointDistance = 0.0

                // 区間距離の計算
                for (let index = _begin; index <= _end; index++) {
                    const _current = state.points[index]
                    const _prev = state.points[index - 1]

                    _current.pointDistance = hubeny(_current.lat, _current.lng, _prev.lat, _prev.lng) * HubenyCorrection
                }

                // 距離の積算
                state.points[0].routeDistance = 0.0
                state.points[0].brmDistance = 0.0

                let prevBrmDistance = 0.0
                let prevIsExcluded = state.points[0].excluded

                for (let index = 1, len = state.points.length; index < len; index++) {
                    const _prev = state.points[index - 1]
                    const _current = state.points[index]
                    _current.routeDistance = _prev.routeDistance + _current.pointDistance

                    _current.brmDistance = (prevIsExcluded || _current.excluded) ? prevBrmDistance : prevBrmDistance + _current.pointDistance
                    prevBrmDistance = _current.brmDistance
                    prevIsExcluded = _current.excluded
                }
            })

        },

        async cacheDemTiles() {

            const ts = Date.now()
            if (this.cacheDemTilesTs > 0 && this.cacheDemTilesTs + 60_000 < ts) {
                console.log('cacheDemTiles: busy')
                return
            }

            const pts = this.points.filter((pt) => !pt.demCached)
            for (const chunk of _.chunk(pts, 1000)) {
                try {
                    this.cacheDemTilesTs = ts
                    await axios({
                        method: "post",
                        url: "api/cacheDemTiles",
                        data: {
                            points: chunk.map(pt => ({ lat: pt.lat, lng: pt.lng }))
                        },
                        timeout: 30_000,    // 30秒
                    })
                    chunk.forEach(pt => { pt.demCached = true })
                    this.cacheDemTilesTs = 0
                }
                catch (e: any) {
                    console.error('cacheDemTiles: somethig wrong', e.name, e.message)
                    this.cacheDemTilesTs = Date.now()    // API の不具合の可能性のためさらに遅延させる
                } finally {
                    await wait(5000)
                }

            }
        },

        /**
         * 除外区間の設定
         *     begin と end に含まれるポイントの exclude プロパティを true にする.
         *     ただし、両端を含む場合と、直前・直後が exclude の場合はそれらも exclude にする.
         * @param {Number} begin 除外開始インデックス
         * @param {Number} end 除外終了インデックス
         */
        setExclude(begin: number, end: number) {
            let _begin = Math.min(begin, end)
            let _end = Math.max(begin, end)

            if (_begin < 0 || _end >= this.count) {
                throw new Error("setExcludeFlag: 範囲が適切ではありません.")
            }

            if (!(_begin === 0 || this.points[_begin - 1]?.excluded)) {
                _begin += 1
            }
            if (!(_end === this.count - 1 || this.points[_end + 1]?.excluded)) {
                _end -= 1
            }
            for (let i = _begin; i <= _end; i++) {
                this.points[i].excluded = true
            }

            this.update()

        },

        /**
         * 除外区間の解除
         *     両端を含めて除外を解除する
         * @param {Number} begin 開始インデックス
         * @param {Number} end 終了インデックス
         */
        restoreExclude(begin: number, end: number) {

            if (begin < 0 || end >= this.count) {
                throw new Error("restoreExcludeFlag: 範囲が適切ではありません.")
            }
            for (let i = begin; i <= end; i++) {
                this.points[i].excluded = false
            }

            this.update()
        },

        /**
         * サブパスの変更適用時にサブパスが除外範囲に被っていたらその除外範囲を一旦解除する
         * 除外範囲が細切れにならないようにする目的
         */
        restoreExcludeWhenSubpathSubmit() {
            const exRange = [...this.excludedRanges]
            exRange.forEach((ex) => {
                if (!(this.subpath.end! < ex.begin! && this.subpath.begin! > ex.end!)) {   // 重なりがある
                    this.restoreExclude(ex.begin!, ex.end!)
                }
            })

            this.update()
        },

        /**
         * サブパスの範囲を設定
         * リアクティブにサブパスの polyline を描画
         * @param range [number, number]
         */
        setSubpath(range: [number, number]) {
            this.$patch({
                subpath: { begin: range[0], end: range[1] }
            })
        },

        resetSubpath(pt?: RoutePoint) {
            if (pt !== undefined) {
                this.subpath = { begin: this.getPointIndex(pt), end: this.getPointIndex(pt) }
            } else {
                this.subpath = { begin: null, end: null }
            }
            this.subpathTemp = { ...this.subpath }
        },

        async subpathReplace() {
            //
            // excluded range を考慮していない
            // 標高の取り込みを行っていない
            //

            const orig = this.subpathRange.points
            const length = orig.length
            const arr: RoutePoint[] = []

            let index = 0

            this.subpathTempPath.forEach(pt => {
                if (index < length && pt.lat === orig[index]?.lat && pt.lng === orig[index]?.lng) {
                    arr.push(orig[index++])
                } else {
                    arr.push(new RoutePoint(pt.lat, pt.lng))
                }
            })

            this.points.splice(this.subpath.begin!, this.subpath.end! - this.subpath.begin! + 1, ...arr)
            await this.update()
        },

        subpathDelete() {
            this.setSubpathTempPath([
                { ...this.points[this.subpath.begin!] },
                { ...this.points[this.subpath.end!] }
            ])
            this.subpathReplace()
        },

        subpathSetExclude() {

            this.setExclude(this.subpath.begin!, this.subpath.end!)
        },


        // Polyline 上を動かしてサブパスを決めるときの一時的なサブパス範囲
        // mouseout でリセットされる
        subpathSync() {
            this.subpathTemp = { ...this.subpath }
        },

        setSubpathTempPath(points: Array<{ lat: number, lng: number }>) {
            this.subpathTempPath = [...points]
        },

        setSubpathDirectionControlPoints(points: Array<{ lat: number, lng: number }>) {
            this.subpathDirectionControlPoints = [...points]
        },

        /**
         * OPENROUTE SERVICEを用いてルート探索する
         * state.subpathDirectionControlPoints: [] を経由
         */
        async directionQuery() {
            const apiKey = import.meta.env.VITE_OPENROUTESERVICE_KEY
            const profile = 'cycling-road'  // 'driving-car', 'driving-hgv', 'cycling-regular', 'cycling-mountain', 'cycling-electric'
            const url = `https://api.openrouteservice.org/v2/directions/${profile}/json`
            const coordinates = [...this.subpathDirectionControlPoints.map(pt => ([pt.lng, pt.lat]))]

            const result = await axios({
                url,
                headers: {
                    Authorization: apiKey
                },
                method: "post",
                data: {
                    coordinates,
                }
            })

            const data = result.data
            this.setSubpathTempPath(polyline.decode(data.routes[0].geometry, false))


        },

        setEditRange(range: [number, number]) {
            const [begin, end] = range
            if (begin > 0) {
                for (let i = 0; i < begin; i++) {
                    this.points[i].editable = false
                }
            }
            for (let i = begin; i <= end; i++) {
                this.points[i].editable = true
            }
            if (end < this.count - 1) {
                for (let i = end + 1; i < this.count; i++) {
                    this.points[i].editable = false
                }
            }
        },

        setEditRangeBegin(beginIndex: number) {
            const end = this.editableIndex[1]
            if (end === null) return
            this.setEditRange([beginIndex, end])
        },

        setEditRangeEnd(endIndex:number){
            const begin=this.editableIndex[0]
            if(begin===null)return
            this.setEditRange([begin,endIndex])
        },

        pack() {
            const encodedPathAlt = this.encodedPathAlt()
            return ({ encodedPathAlt, pointProperties: this.pointProperties() })
        },

        async unpack({ encodedPathAlt, pointProperties }: { encodedPathAlt: string, pointProperties: { [item: string]: Array<number> } }) {

            this.points.length = 0
            const _points = polyline.decode(encodedPathAlt)

            this.points = [...(_points.map((pt) => {
                return new RoutePoint(pt.lat, pt.lng, pt.alt ?? undefined)
            }))]

            pointProperties.excluded.forEach((val, index) => {
                this.points[index].excluded = val === 1 ? true : false
            })

            pointProperties.weight.forEach((weight, index) => {
                this.points[index].weight = weight
            })

            if (pointProperties.demCached) {
                pointProperties.demCached.forEach((val, index) => {
                    this.points[index].demCached = val === 1 ? true : false
                })
            }

            this.update()
            return
        },
        /**
         * GPX データから読み込み用のデータを作成する
         * @param tracks 
         * @returns 
         */
        makePackData(tracks: Array<{ lat: number, lng: number, alt: number }>) {
            const length = tracks.length
            const encodedPathAlt = polyline.encode(tracks.map(pt => ([pt.lat, pt.lng, pt.alt])))
            const excluded = [...Array(length)].map(pt => 0)
            const weight = [...Array(length)].map(pt => 1)
            const demCached = [...Array(length)].map(pt => 0)

            return { encodedPathAlt, pointProperties: { excluded, weight, demCached } }
        }

    }
})
