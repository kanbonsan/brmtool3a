import { defineStore } from 'pinia'
import { CuePoint, cueProperties, cueType } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'

type State = {
    cuePoints: Map<symbol, CuePoint>
}

type GroupCandidate = {
    pre: CuePoint | undefined
    post: CuePoint | undefined
}

export const useCuesheetStore = defineStore('cuesheet', {

    state: (): State => ({
        cuePoints: new Map(),
    }),

    getters: {
        getCuePointById(state) {
            return (id: symbol) => {
                return state.cuePoints.get(id)
            }
        },
        /**
         * マーカーをリスト表示するためのキューポイントの配列を返す
         */
        getArray(state) {
            return Array.from(state.cuePoints, (cue) => cue[1])
        },

        pointList(state): CuePoint[] {
            const brmStore = useBrmRouteStore()
            // POI 以外

            return this.getArray.filter(cpt => {
                return cpt.type !== 'poi'
            })
                .sort((a, b) => {
                    const aRoutePointIndex = brmStore.getPointIndex(brmStore.getPointById(a.routePointId)!)
                    const bRoutePointIndex = brmStore.getPointIndex(brmStore.getPointById(b.routePointId)!)
                    return aRoutePointIndex - bRoutePointIndex
                })

        },

        pcList(state): CuePoint[] {
            return this.pointList.filter(cpt => cpt.type === 'pc')
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
        },

        getGroupCandidate() {
            return (cuePoint: CuePoint): GroupCandidate => {
                const index = this.pcList.findIndex((cpt: CuePoint) => cuePoint.id === cpt.id)
                const _pre = this.pcList[index - 1]
                const _post = this.pcList[index + 1]
                return {
                    pre: _pre && _pre.terminal === undefined ? _pre : undefined,
                    post: _post && _post.terminal === undefined ? _post : undefined
                }
            }
        }

    },

    actions: {

        addCuePoint(point: RoutePoint | { lat: number, lng: number }): CuePoint {

            if (point instanceof RoutePoint) {

                if (this.routePoints.includes(point)) {
                    throw new Error('このポイントにはすでにキューポイントが設定されています')
                }

                const cpt = new CuePoint(point.lat, point.lng, 'cue', point.id)
                this.cuePoints.set(cpt.id, cpt)

                this.update()

                return cpt

            } else {
                const cpt = new CuePoint(point.lat, point.lng, 'poi', null)
                this.cuePoints.set(cpt.id, cpt)

                this.update()

                return cpt
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
         * スタート・ゴールポイントの設定
         * - 末端ポイントは移動できない仕様
         * - 末端にポイントがなければ、未設定かルートの末端部分に変化があったかとなる
         * - 末端でないところにある terminal Pt は普通の cue Pt に変更して、
         * - 末端ポイントを新設
         * 
         * キューポイントに対応する RoutePoint が存在するかのチェック
         * - ルートが変更されて対応するポイントがなくなったときに所属のキューポイントは'poi'にする
         * - ポイントが除外範囲になったときも'poi'にする
         * ルートポイントの変更を伴う処理時には必ず呼び出すようにする
         */
        update() {
            const brmStore = useBrmRouteStore()
            const brmRange = brmStore.brmRange

            // 末端の処理
            this.cuePoints.forEach((cpt: CuePoint) => {
                if (cpt.terminal === undefined) return
                const routePoint = brmStore.getPointById(cpt.routePointId)
                const ptIdx = brmStore.getPointIndex(routePoint!)

                if (ptIdx !== brmRange.begin && ptIdx !== brmRange.end) {
                    cpt.terminal = undefined
                    cpt.type = 'cue'
                }
            })

            if (!brmStore.hasCuePoint(brmRange.begin)) {
                const cpt = this.addCuePoint(brmStore.points[brmRange.begin])
                cpt.type = 'pc'
                cpt.terminal = 'start'
            }
            if (!brmStore.hasCuePoint(brmRange.end)) {
                const cpt = this.addCuePoint(brmStore.points[brmRange.end])
                cpt.type = 'pc'
                cpt.terminal = 'finish'
            }

            // PCグループの処理
            const _pcList = this.pcList
            const _len = _pcList.length

            for (let i = 0; i < _len; i++) {

                const grId = _pcList[i].groupId
                if (grId !== undefined && grId !== _pcList[i + 1].groupId && grId !== _pcList[i - 1].groupId) {
                    _pcList[i].groupId = undefined
                }
            }

            // キューポイントの POI 化
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
                .forEach((cpt, index) => {
                    cpt.pointNo = index + 1
                })
        },

        /**
         * CuePointMenu で内容が変化するたびに呼ばれて store と同期する
         * （CuePointMenu の form で直接 store を更新させるいい方法がなかった）
         * @param id cuePointId
         * @param properties 
         * @param type cueType(properties に混ぜると型がややこしくなるので別口にした)
         */
        synchronize(id: symbol, properties: cueProperties, type: cueType) {
            const cuePoint = this.getCuePointById(id)
            cuePoint!.properties = Object.assign(cuePoint!.properties, properties)
            cuePoint!.type = type
            this.update()
        },

        setGroup(id: symbol, groupWith: 'pre' | 'post') {
            const cpt = this.getCuePointById(id)!
            const gr = this.getGroupCandidate(cpt)
            const grWith = gr[groupWith]!

            if (grWith.groupId === undefined) {
                grWith.groupId = cpt.groupId = Symbol('groupPC')
            } else {
                cpt.groupId = grWith.groupId
            }

            this.update()
        },

        resetGroup(id: symbol) {
            const cpt = this.getCuePointById(id)
            cpt!.groupId = undefined
            this.update()

        }
    }
}
)
