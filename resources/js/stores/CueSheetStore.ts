import { defineStore } from 'pinia'
import { CuePoint, cueProperties, cueType } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'
import { useToolStore } from './ToolStore'
import { PC_SUBGROUP_ENUM } from '@/config'
import { calcOpenClose, limitHours } from '@/lib/brevet'

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

        /**
         * POI以外のポイントをソートして取得
         */
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

        controlList(): CuePoint[] {
            return this.pointList.filter(cpt => cpt.terminal === undefined && (cpt.type === 'pc' || cpt.type === 'pass'))
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

        /**
         * PCの両隣りを取得（スタート・フィニッシュは除く）
         * @returns { pre: CuePoint|undefined, post: CuePoint|undefined}
         */
        getGroupCandidate() {
            return (cuePoint: CuePoint): GroupCandidate => {
                const index = this.controlList.findIndex((cpt: CuePoint) => cuePoint.id === cpt.id)
                const _pre = this.controlList[index - 1]
                const _post = this.controlList[index + 1]
                return {
                    pre: _pre && _pre.type === cuePoint.type ? _pre : undefined,
                    post: _post && _post.type === cuePoint.type ? _post : undefined
                }
            }
        },

        cuesheetData(state) {
            const brmStore = useBrmRouteStore()
            const toolStore = useToolStore()
            const points = this.pointList

            const getDaysLater = (from?: number, to?: number) => {
                if( !from || !to ) return undefined
                const fromMidnight = new Date(from).setHours(0, 0, 0)
                const fromElapsed = from - fromMidnight
                const toMidnight = new Date(to).setHours(0, 0, 0)
                const toElapsed = to - toMidnight
                return Math.floor((to - from) / (24 * 60_000)) + (toElapsed - fromElapsed > 0 ? 1 : 0)
            }

            return (startTs?: number) => {

                return points.map(cpt => {

                    // 名称
                    let namePrefix: string = ``
                    switch (cpt.type) {
                        case 'pc':
                            namePrefix = cpt.terminal === undefined ? `PC${cpt.controlLabel} ` : ''
                            break
                        case 'pass':
                            namePrefix = `CHK${cpt.controlLabel} `
                            break
                    }
                    const name = namePrefix + cpt.cuesheetName

                    // オープン・クローズ

                    // ブルベ日が決まっているか
                    const isFixedDate = toolStore.brmInfo.brmDate !== undefined
                    // ブルベ日（未定の場合は Epoch time）
                    const currentBrmStart = toolStore.currentBrmStart
                    // 表示するテキスト
                    let openLabel: string = ''
                    let closeLabel: string = ''
                    let dayPrefix = ''
                    // オープンのタイムスタンプと何日ずれているか（開催日未定の場合の計算が結構やっかいだったので ↑getDaysLater関数に分けた）
                    const _openTs = (currentBrmStart !== undefined && cpt.openMin !== undefined) ? currentBrmStart + cpt.openMin * 60_000 : undefined
                    const _open = _openTs ? new Date(_openTs) : undefined
                    const _openDayDiff = getDaysLater( currentBrmStart, _openTs )
                    // 同様クローズのタイムスタンプ
                    const _closeTs = (currentBrmStart !== undefined && cpt.closeMin !== undefined) ? currentBrmStart + cpt.closeMin * 60_000 : undefined
                    const _close = _closeTs ? new Date(_closeTs) : undefined
                    const _closeDayDiff = getDaysLater( currentBrmStart, _closeTs)

                    // open
                    switch (cpt.type) {
                        case 'pc':
                           if( cpt.terminal!=='start'){
                                dayPrefix = _openDayDiff === 0 ? '' : ( isFixedDate ? `${_open?.getDay}日/` : `${_openDayDiff}日後/`)
                                openLabel = `${dayPrefix}${_open?.getHours()}:${_open?.getMinutes()}`
                           } 
                           break
                    }

                    return {
                        isFixedDate,
                        routePoint: brmStore.getPointById(cpt.routePointId),
                        pointNo: cpt.pointNo,
                        name,
                        currentBrmStart,
                        direction: cpt.properties.direction,
                        route: cpt.properties.route,
                        distance: cpt.roundDistanceString,
                        lapDistance: cpt.lapDistanceString,
                        note: cpt.properties.note,
                        openMin: cpt.openMin,
                        openTs: _openTs,
                        openLabel,
                        closeMin: cpt.closeMin,
                        closeTs: _closeTs,
                        closeLabel
                    }
                })
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
            const _controlList = this.controlList
            const _len = _controlList.length
            const groupIdSet = new Set<symbol>()

            for (let i = 0; i < _len; i++) {

                const grId = _controlList[i].groupId
                // グループIdの一覧を取得
                if (grId) { groupIdSet.add(grId) }
                const _pre = _controlList[i - 1] ? _controlList[i - 1].groupId : undefined
                const _post = _controlList[i + 1] ? _controlList[i + 1].groupId : undefined

                if (grId !== undefined && grId !== _pre && grId !== _post) {
                    _controlList[i].groupId = undefined
                }
            }
            // グループIdの一覧を配列に[0]をグループなしに
            const groupIdArr = [undefined, ...Array.from(groupIdSet)]
            for (const cpt of _controlList) {
                cpt.groupNo = groupIdArr.findIndex(id => cpt.groupId === id)
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

            // cuePoint.routePointIndex の振り直し
            this.cuePoints.forEach((cpt: CuePoint) => {
                if (cpt.type !== 'poi') {
                    const rpt = brmStore.getPointById(cpt.routePointId)
                    cpt.routePointIndex = brmStore.getPointIndex(rpt!)
                } else {
                    cpt.routePointIndex = undefined
                }
            })

            this.label()
            this.distance()
            this.setTime()
        },

        /**
         * CuePoint のラベル付け（インデックス）
         */
        label() {
            const _pointList = this.pointList
            const _controlList = this.controlList

            // pointNo （キューシートの一列目の番号）
            _pointList.forEach((cpt, index) => {
                cpt.pointNo = index + 1
            })

            // PC, Check ( PC1A:共有 - CHECK - PC1B:共有 という並びはない. 将来的に CHK の共有ができることも考慮)

            // 1st STEP: それぞれの pcNo, controlNo の割付け（グループは同じ番号）
            let _pcNo = 0, _checkNo = 0, _controlNo = 0
            for (let i = 0, len = _controlList.length; i < len; i++) {
                const _current = _controlList[i]
                const _pre = _controlList[i - 1] ?? { type: undefined, groupId: undefined }
                if (_current.type === 'pc') {
                    _current.pcNo = _current.groupId && _current.groupId === _pre.groupId ? _pcNo : ++_pcNo
                    _current.controlNo = _current.groupId && _current.groupId === _pre.groupId ? _controlNo : ++_controlNo
                }
                if (_current.type === 'pass') {
                    _current.checkNo = _current.groupId && _current.groupId === _pre.groupId ? _checkNo : ++_checkNo
                    _current.controlNo = _current.groupId && _current.groupId === _pre.groupId ? _controlNo : ++_controlNo
                }
            }

            // 2nd STEP: ジャンルごと同一 No でまとめる 例）_pc = { 1: [cptA], 2:[cptB, cptC] }
            type Group = { [num: number]: Array<CuePoint> }

            const _pc: Group = {}
            const _check: Group = {}
            const _control: Group = {}

            for (const cpt of _controlList) {

                if (cpt.pcNo) {
                    if (!_pc.hasOwnProperty(cpt.pcNo)) {
                        _pc[cpt.pcNo] = []
                    }
                    _pc[cpt.pcNo].push(cpt)
                }
                if (cpt.checkNo) {
                    if (!_check.hasOwnProperty(cpt.checkNo)) {
                        _check[cpt.checkNo] = []
                    }
                    _check[cpt.checkNo].push(cpt)
                }
                if (cpt.controlNo) {
                    if (!_control.hasOwnProperty(cpt.controlNo)) {
                        _control[cpt.controlNo] = []
                    }
                    _control[cpt.controlNo].push(cpt)
                }
            }

            // 3rd STEP: 実際のラベル付け
            for (const _obj of [_pc, _check, _control]) {
                const labelProperty = _obj === _control ? 'controlLabel' : 'pcLabel'
                for (const _number of Object.keys(_obj)) {
                    const group = _obj[parseInt(_number)]

                    if (group.length === 1) {
                        group[0][labelProperty] = `${_number}`
                    } else {

                        group.forEach((cpt, index) => {
                            cpt[labelProperty] = `${_number}${PC_SUBGROUP_ENUM[index]}`
                        })
                    }
                }
            }
        },

        // 距離の設定
        distance() {
            const _pointList = this.pointList
            const brmStore = useBrmRouteStore()

            const addZero = (val: number) => {
                return `${val * 10}`.replace(/(\d)$/, ".\$1").replace(/^\./, "0.")
            }

            let prevRoundedDistance = 0 // 10倍した値、引き算を整数で行わないと誤差がでることがあるため
            _pointList.forEach((pt: CuePoint) => {
                const routePoint = brmStore.getPointById(pt.routePointId)
                pt.distance = routePoint?.brmDistance
                pt.roundedDistance = Math.ceil((pt.distance! / 1000) * 10) / 10
                pt.lapDistance = (pt.roundedDistance * 10 - prevRoundedDistance) / 10
                prevRoundedDistance = pt.roundedDistance * 10

                pt.roundDistanceString = addZero(pt.roundedDistance)
                pt.lapDistanceString = addZero(pt.lapDistance)
            })
        },

        // PC オープン・クローズ計算
        setTime() {
            const _pointList = this.pointList
            const toolStore = useToolStore()

            const brmDistance = toolStore.brmInfo.brmDistance
            const brmLimitHr = brmDistance ? limitHours.get(brmDistance) : undefined

            for (const cpt of _pointList) {

                const openClose = calcOpenClose(cpt.distance)

                if (!brmDistance || !brmLimitHr || !openClose) {
                    cpt.openMin = cpt.closeMin = undefined  // 途中で undefined に変えられることがあるのでいちいち undefined に設定する
                    continue
                }
                if (cpt.terminal === 'start') {
                    cpt.openMin = 0
                    cpt.closeMin = toolStore.properties.startPcClose
                } else if (cpt.terminal === 'finish') {
                    cpt.openMin = openClose.open
                    cpt.closeMin = brmLimitHr * 60
                } else if (cpt.type === 'pc' || cpt.type === 'pass') {
                    cpt.openMin = openClose.open
                    cpt.closeMin = openClose.close
                } else {
                    cpt.openMin = cpt.closeMin = undefined
                }
            }
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

        /**
         * 前後のPC・CHKとグループ設定する（CHKに関してはグループ化はできないようにしている）
         * @param id
         * @param groupWith 
         */
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
        /**
         * グループの解除
         * @param id    CuePointId
         */
        resetGroup(id: symbol) {
            const cpt = this.getCuePointById(id)
            cpt!.groupId = undefined
            this.update()

        },
        /**
         * Serialize 用のオブジェクトを作成
         * @returns json
         */
        pack() {
            return Array.from(this.cuePoints.values())
        },
        /**
         * 
         * @param json シリアライズデータからの復元
         */
        unpack(arr: Array<{
            type: cueType,
            lat: number,
            lng: number,
            routePointIndex: number,
            terminal: 'start' | 'finish' | undefined,
            properties: cueProperties,
            groupNo: number,
            timestamp: number
        }>) {
            const brmStore = useBrmRouteStore()
            const group = new Map<number, symbol | undefined>()
            group.set(0, undefined)

            // データをクリア
            this.cuePoints.clear()

            for (const _cpt of arr) {
                const rptId = _cpt.type === 'poi' ? null : brmStore.points[_cpt.routePointIndex].id
                const cpt = new CuePoint(_cpt.lat, _cpt.lng, _cpt.type, rptId)
                cpt.terminal = _cpt.terminal
                cpt.properties = { ..._cpt.properties }
                if (!group.has(_cpt.groupNo)) { group.set(_cpt.groupNo, Symbol()) }
                cpt.groupId = group.get(_cpt.groupNo)
                cpt.timestamp = _cpt.timestamp

                this.cuePoints.set(cpt.id, cpt)
            }

            this.update()

        }
    }
}
)
