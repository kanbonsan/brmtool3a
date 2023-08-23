import { defineStore } from 'pinia'
import { CuePoint } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'
import { ar } from 'element-plus/es/locale'

type State = {
    cuePoints: Map<symbol, CuePoint>
}

export const useCuesheetStore = defineStore('cuesheet', {

    state: (): State => ({
        cuePoints: new Map(),
    }),

    getters: {
        getCuePointById(state) {
            return (id: symbol) => {
                this.cuePoints.get(id)
            }
        },
        /**
         * マーカーをリスト表示するためのキューポイントの配列を返す
         */
        getArray(state) {
            return Array.from(state.cuePoints, (cue) => cue[1])
        },

        /**
         * キューポイントが設定されているルートポイントのリストを返す
         * ルートポイントにすでにキューポイントが設定されているときにさらに追加設定されるのを防止するのに利用する
         */
        routePoints(state) {
            const brmStore = useBrmRouteStore()
            const arr: RoutePoint[] = []

            state.cuePoints.forEach(cpt => {
                const pt = brmStore.getPointById(cpt.routePointId)
                if (pt !== undefined) {
                    arr.push(pt)
                }
            })
            return arr
        }

    },

    actions: {

        addCuePoint(point: RoutePoint | { lat: number, lng: number }) {

            if (point instanceof RoutePoint) {

                if (this.routePoints.includes(point)) {
                    throw new Error('このポイントにはすでにキューポイントが設定されています')
                }

                const cpt = new CuePoint(point.lat, point.lng, 'cue', point.id)
                this.cuePoints.set(cpt.id, cpt)

                this.update()

            } else {
                const cpt = new CuePoint(point.lat, point.lng, 'poi', null)
                this.cuePoints.set(cpt.id, cpt)

                this.update()
            }

        },

        reattachCuePoint(cuePoint: CuePoint, routePoint: RoutePoint) {
            const brmStore = useBrmRouteStore()

            const currentRoutePoint = (cuePoint.routePointId !== null) ? brmStore.getPointById(cuePoint.routePointId) : null

            if (currentRoutePoint && currentRoutePoint.id === routePoint.id) {
                throw new Error('同じポイントに再設定しようとしています')
            }
            if (this.routePoints.includes(routePoint)) {
                throw new Error('このポイントにはすでにキューポイントが設定されています')
            }

            cuePoint.routePointId = routePoint.id
            if (cuePoint.type === "poi") {
                cuePoint.type = "cue"
            }

            this.update()

        },

        detachCuePoint(cuePoint: CuePoint) {
            cuePoint.type = "poi"
            cuePoint.routePointId = null

            this.update()
        },

        removeCuePoint(id: symbol) {
            this.cuePoints.delete(id)

            this.update()
        },
        /**
         * キューポイントに対応する RoutePoint が存在するかのチェック
         * - ルートが変更されて対応するポイントがなくなったときに所属のキューポイントは'poi'にする
         * - ポイントが除外範囲になったときも'poi'にする
         * ルートポイントの変更を伴う処理時には必ず呼び出すようにする
         */
        update() {
            const brmStore = useBrmRouteStore()
            this.cuePoints.forEach((cpt: CuePoint) => {
                // 元々 'poi' のときは終了
                if (!cpt.routePointId) return
                // ルートポイントが消滅したとき
                if (!brmStore.idList.includes(cpt.routePointId)) {
                    cpt.type = "poi"
                    cpt.routePointId = null
                } else {
                    // ルートポイントが除外区域ではないか？
                    const rpt = brmStore.getPointById(cpt.routePointId)
                    if (rpt!.excluded === true) {
                        cpt.type = "poi"
                        cpt.routePointId = null
                    }
                }
            })
            this.label()
        },
        /**
         * CuePoint のラベル付け（インデックス）
         */
        label() {
            const brmStore = useBrmRouteStore()
            // POI 以外
            this.getArray
                .filter(cpt => {
                    return cpt.type !== 'poi'
                })
                .sort((a, b) => {
                    const aRoutePointIndex = brmStore.getPointIndex(brmStore.getPointById(a.routePointId)!)
                    const bRoutePointIndex = brmStore.getPointIndex(brmStore.getPointById(b.routePointId)!)
                    return aRoutePointIndex - bRoutePointIndex
                })
                .forEach( (cpt,index)=>{
                    cpt.pointNo = index + 1
                })
        },

        synchronize(id:symbol){
            console.log('sync store')
        }
    }
}
)
