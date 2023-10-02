import { defineStore } from 'pinia'
import { useBrmRouteStore } from './BrmRouteStore'


type State = {
    // Canvas サイズ
    width: number | undefined,
    height: number | undefined
    // 表示範囲
    distance: {
        begin: number,
        end: number | undefined,
    },
    altitude: {
        low: number,
        high: number | undefined,
    }
}

const distancePitchList = [5, 10, 50, 100, 200, 250, 500, 1000, 5000, 10_000, 20_000, 25_000, 50_000, 100_000]
const altitudePitchList = [100, 250, 500, 1000, 2000]

export const useProfileStore = defineStore('profile', {


    state:
        (): State => ({
            width: undefined,
            height: undefined,
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

        /**
         * ピクセル数で分割してそれぞれのピクセルの（平均）標高を返す
         * @param pixels {number} ピクセル数
         * @param begin {number} 開始距離
         * @param end? {number} 最終距離
         * @returns Array<number>
         */
        profile(state) {
            const brmStore = useBrmRouteStore()
            const points = brmStore.points.filter(pt => !pt.excluded)

            return (pixels: number, begin = 0.0, _end?: number) => {
                if (points.length === 0) {
                    return []
                }

                const end = _end || points.slice(-1)[0].brmDistance
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

            }
        },

        xPitch(state) {
            if (!this.distance.end) {
                return undefined
            }

        },

        yPitch(state) {
            if (!this.altitude.high) { return undefined }
        }


    }
})