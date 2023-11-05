import { defineStore } from 'pinia'
import { useBrmRouteStore } from './BrmRouteStore'


type State = {
    // Canvas サイズ
    width: number | undefined,
    height: number | undefined,

    // グラフエリア
    margin: {
        top: number,
        bottom: number,
        left: number,
        right: number
    },

    // 表示範囲
    distance: {
        begin: number,
        end: number | undefined,
    },
    altitude: {
        low: number,
        high: number | undefined,
    },
}

const distancePitchList = [5, 10, 50, 100, 200, 250, 500, 1000, 5000, 10_000, 20_000, 25_000, 50_000, 100_000]
const altitudePitchList = [20, 50, 100, 250, 500, 1000, 2000]
// グラフの目盛り間隔 ピクセル
const graphScalePitch = 50

export const useProfileStore = defineStore('profile', {


    state:
        (): State => ({
            width: undefined,
            height: undefined,
            margin: {
                top: 10,
                bottom: 30,
                left: 40,
                right: 0,
            },
            distance: {
                begin: 0.0,
                end: undefined,
            },
            altitude: {
                low: 0.0,
                high: undefined
            }
        }),

    getters: {

        graphSize(state) {
            const width = state.width ? Math.floor(state.width - state.margin.left - state.margin.right) : undefined
            const height = state.height ? Math.floor(state.height - state.margin.top - state.margin.bottom) : undefined
            return { width, height }
        },

        graphScale(state): { xAxis: number | undefined, yAxis: number | undefined } {
            if (!state.width || !state.height || !state.distance.end || !state.altitude.high) {
                return { xAxis: undefined, yAxis: undefined }
            }

            // graphScalePitch(ピクセル)分の距離・標高
            const xPitch = (state.distance.end - state.distance.begin) / this.graphSize.width! * graphScalePitch
            const yPitch = (state.altitude.high - state.altitude.low) / this.graphSize.height! * graphScalePitch
            // それぞれに近い目盛りを求める
            const xAxis = distancePitchList.reduce((pitch, current) => xPitch < current ? pitch : current)
            const yAxis = altitudePitchList.reduce((pitch, current) => yPitch < current ? pitch : current)

            return { xAxis, yAxis }
        },

        // グラフ原点のキャンバス座標
        graphOrigin(state): { xOrig: number | undefined, yOrig: number | undefined } {
            if (!this.graphSize.width || !this.graphSize.height) return { xOrig: undefined, yOrig: undefined }
            const x = state.margin.left + 0.5
            const y = this.graphSize.height! + state.margin.top + 0.5
            return { xOrig: x, yOrig: y }
        },

        // グラフの解像度 meter/pixel
        graphResolution(state): { x: number | undefined, y: number | undefined } {
            const x = (state.distance.end !== undefined && this.graphSize.width !== undefined) ? this.graphSize.width / (state.distance.end - state.distance.begin) : undefined
            const y = (state.altitude.high !== undefined && this.graphSize.height !== undefined) ? this.graphSize.height / (state.altitude.high - state.altitude.low) : undefined

            return { x, y }
        },

        /**
         * ピクセル数で分割してそれぞれのピクセルの（平均）標高を返す
         * @param pixels {number} ピクセル数
         * @param begin {number} 開始距離
         * @param end? {number} 最終距離
         * @returns Array<number>
         */
        profile(state): Array<{
            begin: number,
            end: number,
            min: number,
            max: number,
            mean: number
        }> {

            if (!this.graphSize!.height! || !this.graphSize.width || !state.distance.end) return []

            const brmStore = useBrmRouteStore()
            const points = brmStore.points.filter(pt => !pt.excluded)

            if (points.length === 0) return []

            const pixels = this.graphSize.width
            const { begin, end } = state.distance

            const resolution = (end - begin) / pixels
            const pixelAltitude = []

            for (let pix = 0, ptIndex = 0; pix < pixels; pix++) {

                const pixDistA = begin + resolution * pix
                const pixDistB = pixDistA + resolution

                let accumAltitude = 0.0
                let min = +Infinity
                let max = -Infinity

                while (true) {
                    const pt = points[ptIndex]

                    // タイミングの都合で pt===undefined となることがあるよう
                    if(!pt){
                        break 
                     }                    

                    const ptDistA = pt.brmDistance
                    const ptDistB = ptIndex < points.length - 1 ? points[ptIndex + 1].brmDistance : end
                    if (ptDistB < pixDistA) {
                        ++ptIndex
                        continue
                    }

                    if (ptDistA > pixDistB) {
                        break
                    }
                    const interSectA = Math.max(pixDistA, ptDistA)
                    const interSectB = Math.min(pixDistB, ptDistB)

                    min = Math.min(min, pt.alt!)
                    max = Math.max(max, pt.alt!)

                    accumAltitude += (interSectB - interSectA) / resolution * (pt?.alt || 0)
                    if (ptDistB < pixDistB) {
                        ++ptIndex
                    } else {
                        break
                    }
                }

                pixelAltitude.push({ begin: pixDistA, end: pixDistB, mean: accumAltitude, min, max })

            }

            return pixelAltitude
        },
        // 距離→キャンバス座標（原点が +0.5 なのでそのまま +0.5）
        getX(state) {
            return (dist: number) => {
                return this.graphOrigin.xOrig! + Math.floor((dist - state.distance.begin) * this.graphResolution.x!)
            }
        },
        // 標高→キャンバス座標
        getY(state) {
            return (alt: number) => {
                return this.graphOrigin.yOrig! - Math.floor((alt - state.altitude.low) * this.graphResolution.y!)
            }
        }
    },
    actions: {
        setDistance(range:{begin?:number, end?:number}){
            this.distance.begin = range.begin ?? this.distance.begin
            this.distance.end = range.end ?? this.distance.end
        }
    }
})