import { defineStore } from 'pinia'
import { polyline } from '@/lib/polyline'
import { simplifyPath } from '@/lib/douglasPeucker'
import { hubeny } from '@/lib/hubeny'
import { HubenyCorrection, weighedThreshold } from '@/config.js'

import { useGmapStore } from '@/stores/GmapStore.js'
import { useToolStore } from './ToolStore'
import { useCuesheetStore } from './CueSheetStore'
import { RoutePoint } from '@/classes/routePoint'

import { worldCoord } from '@/lib/mapcoord'
import axios from 'axios'
import { Route } from 'ziggy-js'

const simplifyParam = [
    { weight: 3, tolerance: 0.000015 },
    { weight: 5, tolerance: 0.00005 },
    { weight: 7, tolerance: 0.0002 },
    { weight: 9, tolerance: 0.0005 }
]

type State = {
    points: RoutePoint[],
    subpath: {
        begin: number | null,
        end: number | null
    }
    subpathTemp: {  // マップ上のポイント操作でもサブパスを調整できるように
        begin: number | null,
        end: number | null
    }
    subpathTempPath: Array<{ lat: number, lng: number }>

}

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
        subpath: {
            begin: null,
            end: null
        },
        subpathTemp: {
            begin: null,
            end: null
        },
        subpathTempPath: [] // 確定前のサブパスのポイントを入れておく
    }),

    getters: {
        /** ポイント数 */
        count: (state): number => state.points.length,

        /** simplify 用の配列（x,y) を用意 */
        pointsArray: (state) => state.points.map((pt, index) => ({ x: pt.lng ?? 0, y: pt.lat ?? 0, index })),

        /** ある程度以上のポイント */
        weighedPoints: (state): RoutePoint[] => state.points.filter(pt => pt.weight >= weighedThreshold),


        /** map 内におさまるポイント */
        availablePoints(state): RoutePoint[] {
            const gmapStore = useGmapStore()
            return this.weighedPoints.filter(pt => gmapStore.latLngBounds?.contains(pt))
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

        /** point id からルートポイントを返す */
        getPointById: (state) => (id: symbol) => {
            const idx = state.points.findIndex(pt => pt.id === id)
            return state.points[idx]
        },

        /** point の インデックスを返す */
        getPointIndex: (state) => (pt: RoutePoint) => {
            return state.points.findIndex(_pt => _pt.id === pt.id)
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
                return ({ begin, end, points, id: Symbol() })
            })
        },
        /**
         * 編集範囲のインデックスを返す
         * @param state 
         * @returns
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

            const toolStore = useToolStore()

            const begin = state.subpath.begin
            const end = state.subpath.end
            const editable = toolStore.subpathEditMode
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

        getClosePoint() {

            type ClosePoint = {
                pt: RoutePoint | null,
                dist: number
            }

            const deviateThreshold: number = 0.001

            return (position: google.maps.LatLng) => {

                const posLat = position.lat()
                const posLng = position.lng()

                const candidate = this.weighedPoints.filter((pt: RoutePoint) => {

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
         * RoutePoint id: symbole の一覧
         * CueSheetStore で routepoint id の振り直しに利用
         */
        idList(state): symbol[] {
            return state.points.map(pt => pt.id)
        },

        /**
         * RoutePoint に CuePoint が設定されているか
         * 一つのRoutePointにはCuePointは一つしか設定できない
         * @returns boolean
         */
        hasCuePoint() {
            const cuesheetStore = useCuesheetStore()
            return (pt: RoutePoint) => {

            }
        },

    },

    actions: {
        /** encoded Path を与えて初期化する */
        setPoints(path: string) {

            const _points = polyline.decode(path)

            this.points = [...(_points.map((pt) => {
                return new RoutePoint(pt.lat, pt.lng, pt.alt ?? undefined)
            }))]

            // ポイントウエイトを設定
            this.setWeight()

            // 距離を計算
            this.setDistance()

            // 標高獲得用の DEM タイルを予めサーバーにキャッシュしておく
            this.cacheDemTiles()

        },

        /**
         * ポイントウエイトの設定
         *  パラメータに従って重み付けしてマーカーを付けるかどうかを決定する
         *  max 10（キューポイント設定点や任意設定点につける）
         *  min 1
         */
        setWeight() {
            // ポイントウエイトのリセット

            for (const condition of simplifyParam) {
                const tolerance = condition.tolerance
                const weight = condition.weight
                const _result = simplifyPath(this.pointsArray, tolerance)

                _result.forEach(pt => {
                    this.points[pt.index].weight = Math.max(this.points[pt.index].weight, weight)
                })
            }
        },
        /**
         * ポイントの距離を設定する
         *  Hubeny 計算のコストを考えて hubeny の計算範囲を指定できるようにする
         * 
         * @param {number} begin hubeny 計算の開始ポイント（index）
         * @param {number} end 同終了ポイント
         * @return {void}
         */
        setDistance(begin = -Infinity, end = Infinity) {

            const _begin = Math.max(1, begin)
            const _end = Math.min(end + 1, this.count - 1)

            if (_end < _begin) {
                throw new Error('setDistance: 開始点が終了点よりあとになっています')
            }

            // 先頭ごと入れ替わったときへの対応
            this.points[0].pointDistance = 0.0

            // 区間距離の計算
            for (let index = _begin; index <= _end; index++) {
                const _current = this.points[index]
                const _prev = this.points[index - 1]

                _current.pointDistance = hubeny(_current.lat, _current.lng, _prev.lat, _prev.lng) * HubenyCorrection
            }
            // 距離の積算
            this.points[0].routeDistance = this.points[0].brmDistance = 0.0
            let prevBrmDistance = 0.0
            let prevIsExcluded = this.points[0].excluded

            for (let index = 1; index < this.count; index++) {
                const _prev = this.points[index - 1]
                const _current = this.points[index]
                _current.routeDistance = _prev.routeDistance + _current.pointDistance

                _current.brmDistance = (prevIsExcluded || _current.excluded) ? prevBrmDistance : prevBrmDistance + _current.pointDistance
                prevBrmDistance = _current.brmDistance
                prevIsExcluded = _current.excluded
            }
        },

        async cacheDemTiles() {

            const result = await axios({
                method: "post",
                url: "api/cacheDemTiles",
                data: {
                    points: this.pointsArray.map((pt) => ({ lat: pt.y, lng: pt.x }))
                }
            })

            console.log(result.data)

        },

        /**
         * 除外区間の設定
         *     begin と end に含まれるポイントの exclude プロパティを true にする.
         *     ただし、両端を含む場合、直前・直後が exclude の場合はそれらも exclude にする.
         * @param {Number} begin 除外開始インデックス
         * @param {Number} end 除外終了インデックス
         */
        setExclude(begin: number, end: number) {
            let _begin = Math.min(begin, end)
            let _end = Math.max(begin, end)

            if (_begin < 0 || _end >= this.count) {
                throw new Error("setExcludeFlag: 範囲が適切ではありません.")
            }

            if (_begin === 0 || this.points[_begin - 1]?.excluded) {
                _begin -= 1
            }
            if (_end === this.count - 1 || this.points[_end + 1]?.excluded) {
                _end += 1
            }
            for (let i = _begin; i <= _end; i++) {
                this.points[i].excluded = true
            }

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
        },

        /**
         * 指定範囲のポイントの削除
         * @param begin 
         * @param end 
         * @returns 
         */
        removePoints(begin: number, end: number) {
            const cuesheetStore = useCuesheetStore()

            if (begin < 0 || end >= this.count || end < begin) {
                throw new Error('removePoints: パラメータが不正です')
            }
            this.points.splice(begin, end - begin + 1)
            // キューポイントの更新
            cuesheetStore.checkAttach()
        },

        /**
         * サブパスの範囲を設定
         * リアクティブにサブパスの polyline を描画
         * @param range [number, number]
         */
        setSubpath(range: [number, number]) {
            this.subpath.begin = range[0]
            this.subpath.end = range[1]
        },

        resetSubpath(pt?: RoutePoint) {
            if (pt !== undefined) {
                this.subpath = { begin: this.getPointIndex(pt), end: this.getPointIndex(pt) }
            } else {
                this.subpath = { begin: null, end: null }
            }
            this.subpathTemp = { ...this.subpath }
        },

        subpathSync() {
            this.subpathTemp = { ...this.subpath }
        },

        setSubpathTempPath(points: Array<{ lat: number, lng: number }>) {
            this.subpathTempPath = [...points]
        },

        // 以下はテスト・実験用

        deviate(begin = 100, end = 200) {
            const cuesheetStore = useCuesheetStore()
            for (let i = begin; i <= 100; i++) {

                this.points[i].lng += 0.01
                this.points[i].id = Symbol()

            }
            this.setWeight()
            // キューポイントの更新
            cuesheetStore.checkAttach()
        },

        delete(begin = 1450, end = 1499) {
            const cuesheetStore = useCuesheetStore()
            this.points.splice(begin, end - begin)
            // キューポイントの更新
            cuesheetStore.checkAttach()
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
        }
    }
})
