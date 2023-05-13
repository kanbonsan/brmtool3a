import { defineStore } from 'pinia'
import { polyline } from '@/lib/polyline'
import { simplifyPath } from '@/lib/douglasPeucker'
import { hubeny } from '@/lib/hubeny'
import { HubenyCorrection } from '@/config.js'

import { useGmapStore } from '@/stores/GmapStore.js'
import { RoutePoint } from '@/classes/routePoint'

const simplifyParam = [
    { weight: 3, tolerance: 0.000015 },
    { weight: 5, tolerance: 0.00005 },
    { weight: 7, tolerance: 0.0002 },
    { weight: 9, tolerance: 0.0005 }
]

export const useBrmRouteStore = defineStore('brmroute', {

    state: () => ({
        points: [],
    }),

    getters: {
        /** ポイント数 */
        count: (state) => state.points.length,

        /** simplify 用の配列（x,y) を用意 */
        pointsArray: (state) => state.points.map((pt, index) => ({ x: pt.lng ?? 0, y: pt.lat ?? 0, index })),

        /** map 内におさまるポイント */
        availablePoints: (state) => state.points.filter((pt) => {
            const gmapStore = useGmapStore()
            return gmapStore.latLngBounds?.contains(pt) && pt.weight > 7
        }),

        polylinePoints: (state) => state.points.filter(pt => pt.weight >= 5),

        /** point id からポイントインデックスを抽出 */
        getPointById: (state) => {
            return (id) => state.points.findIndex(pt => pt.id === id)
        },
        /**
         * (getter) 除外範囲の開始と終了の各インデックスを求める
         * リアクティブに polyline を書き換えてもらうために unique ID を Symbol() で振る
         * @returns Array<{ begin, end, id: Symbol()}>
         */
        excludedRanges: (state) => {
            const arr = []
            let begin
            let end
            for (let i = 0; i < state.count; i++) {
                const pt = state.points[i]
                if (pt.excluded === true) {
                    if (!begin) {
                        begin = i
                    }
                    end = i
                } else {
                    if (begin) {
                        arr.push({ begin, end })
                        begin = null
                        end = null
                    }
                }
            }
            // 除外区間がない場合
            if (arr.length === 0) { return arr }

            return arr.map((range) => {
                const begin = Math.max(range.begin - 1, 0)
                const end = Math.min(range.end + 1, state.count - 1)
                const points = []
                points.push(state.points[begin])
                for (let i = begin + 1; i < end; i++) {
                    if (state.points[i].weight >= 3) {
                        points.push(state.points[i])
                    }
                }
                points.push(state.points[end])
                return ({ begin, end, points, id: Symbol() })
            })
        }

    },

    actions: {
        /** encoded Path を与えて初期化する */
        setPoints(path) {

            const _points = polyline.decode(path)

            this.points = [...(_points.map((pt) => {
                return new RoutePoint(pt.lat, pt.lng, pt.alt)
            }))]

            // ポイントウエイトを設定
            this.setWeight()

            // 距離を計算
            this.setDistance()

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
                console.log('wt: %d %d', weight, _result.length)

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
        /**
         * 除外区間の設定
         *     begin と end に含まれるポイントの exclude プロパティを true にする.
         *     ただし、両端を含む場合、直前・直後が exclude の場合はそれらも exclude にする.
         * @param {Number} begin 除外開始インデックス
         * @param {Number} end 除外終了インデックス
         */
        setExclude(begin, end) {
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
        restoreExclude(begin, end) {
            if (begin < 0 || end >= this.count) {
                throw new Error("restoreExcludeFlag: 範囲が適切ではありません.")
            }
            for (let i = begin; i <= end; i++) {
                this.points[i].excluded = false
            }
        },

        // 以下はテスト・実験用

        deviate(begin = 100, end = 200) {
            for (let i = begin; i <= 100; i++) {

                this.points[i].lng += 0.01
                this.points[i].id = Symbol()

            }
            this.setWeight()
        },

        delete(begin=1450,end=1499){
            this.points.splice(begin,end-begin)
        }
    }
})
