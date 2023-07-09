import { defineStore } from 'pinia'
import { CuePoint } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'

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
         * キューシート用にソート
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
                if (cpt.routePointId !== null) {
                    arr.push(brmStore.getPointById(cpt.routePointId))
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

                const cpt = new CuePoint(point.lat, point.lng, 'cue', point.id, point.pointDistance)
                this.cuePoints.set(cpt.id, cpt)
            } else {
                const cpt = new CuePoint(point.lat, point.lng, 'poi', null)
                this.cuePoints.set(cpt.id, cpt)
            }

        },

        reattachCuePoint(cuePoint: CuePoint, routePoint: RoutePoint) {
            const brmStore = useBrmRouteStore()

            const currentRoutePoint = cuePoint.routePointId !== null ? brmStore.getPointById(cuePoint.routePointId) : null
            if (currentRoutePoint && currentRoutePoint.id === routePoint.id) {
                throw new Error('同じポイントに再設定しようとしています')
            }
            if (this.routePoints.includes(routePoint)) {
                throw new Error('このポイントにはすでにキューポイントが設定されています')
            }

            cuePoint.setRoutePoint(routePoint.id, routePoint.pointDistance)
        },

        detachCuePoint(cuePoint: CuePoint) {
            cuePoint.setType('poi')
            cuePoint.setRoutePoint(null)
        },

        removeCuePoint(id: symbol) {
            this.cuePoints.delete(id)
        },
        /**
         * キューポイントに対応する RoutePoint が存在するかのチェック
         * - ルートが変更されて対応するポイントがなくなったときに所属のキューポイントは'poi'にする
         * - ポイントが除外範囲になったときも'poi'にする
         * ルートポイントの変更を伴う処理時には必ず呼び出すようにする
         */
        checkAttach() {
            const brmStore = useBrmRouteStore()
            this.cuePoints.forEach((cpt: CuePoint) => {
                // 元々 'poi' のときは終了
                if (!cpt.routePointId) return
                // ルートポイントが消滅したとき
                if (!brmStore.idList.includes(cpt.routePointId)) {
                    cpt.setType('poi')
                    cpt.routePointId = null
                } else {
                    // ルートポイントが除外区域ではないか？
                    const rpt = brmStore.getPointById(cpt.routePointId)
                    if(rpt.excluded===true){
                        cpt.setType('poi')
                        cpt.routePointId = null
                    }
                }
            })
        }
    }
}
)
