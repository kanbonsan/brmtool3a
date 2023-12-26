import { defineStore } from 'pinia'
import { CuePoint, cueProperties, cueType } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'
import { useToolStore } from './ToolStore'
import { useGeocodeStore } from './GeocodeStore'
import { PC_SUBGROUP_ENUM } from '@/config'
import { calcOpenClose, limitHours } from '@/lib/brevet'

type State = {
    cuePoints: Map<symbol, CuePoint>
    highlight?: symbol
    highlightTimer?: number
}

type GroupCandidate = {
    pre: CuePoint | undefined
    post: CuePoint | undefined
}

export const useCuesheetStore = defineStore('cuesheet', {

    state: (): State => ({
        cuePoints: new Map(),
        highlight: undefined    // キューシートの POI リスト上の hover に連動させる
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
         * キューポイントが編集範囲か
         * 　POI の場合は常に可. editableRange が null を返したときも考慮
         */
        isActive() {
            const routeStore = useBrmRouteStore()
            const editableRange = routeStore.editableIndex
            const isAvailable = (editableRange[0] !== null && editableRange[1] !== null)
            return (cpt: CuePoint) => {
                if (cpt.type === 'poi' || !isAvailable) return true
                const routeIndex = routeStore.getPointIndexById(cpt.routePointId)
                if (routeIndex! < editableRange[0]! || editableRange[1]! < routeIndex!) {
                    return false
                } else {
                    return true
                }
            }
        },

        /**
         * POI以外のポイントをソートして取得
         */
        pointList(): CuePoint[] {
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

        /**
         * スタート・フィニッシュを除くコントロールポイントを取得
         */
        controlList(): CuePoint[] {
            return this.pointList.filter(cpt => cpt.terminal === undefined && (cpt.type === 'pc' || cpt.type === 'pass'))
        },

        /**
         * POIリスト
         * 作成順にソート（ソート方法は色々と検討の余地あり）
         */
        poiList(): CuePoint[] {
            return this.getArray.filter(cpt => {
                return cpt.type === 'poi'
            }).sort((a, b) => a.timestamp - b.timestamp)
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

        /**
         * キューシート表示用データ
         */
        cuesheetData() {
            const brmStore = useBrmRouteStore()
            const toolStore = useToolStore()
            const points = this.pointList   // 'poi' 以外のポイント

            const getDaysLater = (from?: number, to?: number) => {
                if (!from || !to) return undefined
                const zero = new Date(from).setHours(0, 0, 0)   // from の 0:00:00
                return Math.floor((to - zero) / (24 * 3600_000))
            }

            const format = (dt?: Date) => {
                return dt ? `${dt.getHours()}:` + `00${dt.getMinutes()}`.slice(-2) : ''
            }

            // 関数ゲッターの本体
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
                    const isFixedBrmDistance = toolStore.brmInfo.brmDistance !== undefined

                    // 表示するテキスト
                    let openLabel: string | undefined = ''
                    let closeLabel: string | undefined = ''
                    let dayPrefix = ''
                    // オープンのタイムスタンプと何日ずれているか（開催日未定の場合の計算が結構やっかいだったので ↑getDaysLater関数に分けた）
                    const _openTs = (startTs !== undefined && cpt.openMin !== undefined) ? startTs + cpt.openMin * 60_000 : undefined
                    const _open = _openTs ? new Date(_openTs) : undefined
                    const _openDayDiff = getDaysLater(startTs, _openTs)
                    // 同様クローズのタイムスタンプ
                    const _closeTs = (startTs !== undefined && cpt.closeMin !== undefined) ? startTs + cpt.closeMin * 60_000 : undefined
                    const _close = _closeTs ? new Date(_closeTs) : undefined
                    const _closeDayDiff = getDaysLater(startTs, _closeTs)

                    // open
                    switch (cpt.type) {
                        case 'pc':
                            dayPrefix = _openDayDiff === 0 ? '' : (isFixedDate ? `${_open?.getDay()}日/` : `+${_openDayDiff}d/`)
                            openLabel = `${dayPrefix}${format(_open!)}`
                            break
                        case 'pass':
                            dayPrefix = _openDayDiff === 0 ? '' : (isFixedDate ? `${_open?.getDay()}日/` : `+${_openDayDiff}d/`)
                            openLabel = `(参考 ${dayPrefix}${format(_open)})`
                            break
                    }
                    // close
                    switch (cpt.type) {
                        case 'pc':
                            dayPrefix = _closeDayDiff === 0 ? '' : (isFixedDate ? `${_close?.getDay()}日/` : `+${_closeDayDiff}d/`)
                            closeLabel = `${dayPrefix}${format(_close!)}`
                            break
                        case 'pass':
                            dayPrefix = _closeDayDiff === 0 ? '' : (isFixedDate ? `${_close?.getDay()}日/` : `+${_closeDayDiff}d/`)
                            closeLabel = `(参考 ${dayPrefix}${format(_close)})`
                            break
                    }

                    return {
                        id: cpt.id,
                        type: cpt.type,
                        isFixedDate,
                        routePoint: brmStore.getPointById(cpt.routePointId),
                        pointNo: cpt.pointNo,
                        name,
                        direction: cpt.properties.direction,
                        route: cpt.properties.route,
                        distance: cpt.roundDistanceString,
                        lapDistance: cpt.lapDistanceString,
                        note: cpt.properties.note,
                        openMin: cpt.openMin,
                        openTs: _openTs,
                        openLabel: _open ? openLabel : undefined,
                        closeMin: cpt.closeMin,
                        closeTs: _closeTs,
                        closeLabel: _close ? closeLabel : undefined
                    }
                })
            }
        },

        poiData():Array<{}>{
            const points=this.poiList
            return points.map((poi)=>{
                return {
                    id: poi.id, 
                    poiNo: poi.poiNo!,
                    address: poi.poiAddress!,
                    lat: poi.lat,
                    lng: poi.lng,
                    name: poi.properties.name,
                    garminDeviceIcon: poi.properties.garminDeviceIcon,
                    garminDeviceText: poi.properties.garminDeviceText,
                    note: poi.properties.note,
                    timestamp: poi.timestamp,
                }
            })
        }

    },

    actions: {

        /**
         * 
         * @param point RoutePoint を与えたときは 'cue' Lat・Lng を与えたときは 'poi' を登録
         * @returns CuePoint
         */
        addCuePoint(point: RoutePoint | { lat: number, lng: number }): CuePoint {

            if (point instanceof RoutePoint) {

                if (this.routePoints.includes(point)) {
                    throw new Error('このポイントにはすでにキューポイントが設定されています')
                }

                // Voluntary ポイントとして登録（cue point が解除されてもそのまま... とくに問題はないでしょう）
                point.weight = 20

                const cpt = new CuePoint(point.lat, point.lng, 'cue', point.id)
                this.cuePoints.set(cpt.id, cpt)

                this.update()

                return cpt

            } else {
                const cpt = new CuePoint(point.lat, point.lng, 'poi', null)
                this.cuePoints.set(cpt.id, cpt)

                // POI が新設されたときは address を設定
                this.setPoiAddress(cpt.id)

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
         * 状態の更新処理
         * 
         * 1. キューポイントの POI 化
         *      参照していた RoutePoint が消滅したとき
         *      RoutePoint が excluded になったとき
         *      ※ option: poiDelete: boolean = true で POI化したポイントを消去
         * 2. start/finish ポイントの処理
         *      start/finish ポイントの参照する RoutePoint が末端でなくなればただの cue にする
         *      末端のポイントが start/finish でなくなってしまった場合は強制的に start/finish に変更
         *      末端に start/finish がなければ新設する
         * 3. PCグループの処理
         *      cuePoint.groupNo をつけていく。0 はグループなし、1,2,3... と振る。順番は問わない。
         *      シリアライズの際に symbol は使えないのでこちらを使用している
         * 4. cuePoint.routePointIndex の振り直し
         * 
         * 5. label付け label() 関数
         *      cuePoint.pcNo, controlNo, checkNo, controlLabel, pcLabel
         *      はこの時点でつけられる
         * 6. 距離の計測 distance() 関数
         *      cuePoint.distance, roundedDistance, lapDistance, roundDistanceString, lapDisntaceString
         *      はこの時点でつけられる
         * 7. 時間の計算
         *      cuePoint.openMin, closeMin はこの時点でつけられる
         */
        update(poiDelete: boolean = false) {

            const routeStore = useBrmRouteStore()
            const brmRange = routeStore.brmRange

            // キューポイントの POI 化
            this.cuePoints.forEach((cpt: CuePoint) => {
                // 元々 'poi' のときは終了（
                if (!cpt.routePointId) return
                // ルートポイントが消滅したとき
                if (!routeStore.idList.includes(cpt.routePointId)) {
                    if (poiDelete) {
                        this.cuePoints.delete(cpt.id)
                    } else {
                        cpt.type = "poi"
                        cpt.routePointId = null
                        cpt.terminal = undefined
                        this.setPoiAddress(cpt.id)
                    }
                } else {
                    // ルートポイントが除外区域ではないか？
                    const rpt = routeStore.getPointById(cpt.routePointId)
                    if (rpt!.excluded === true) {
                        cpt.type = "poi"
                        cpt.routePointId = null
                        cpt.terminal = undefined
                        this.setPoiAddress(cpt.id)
                    }
                }
            })

            // 末端の処理
            this.cuePoints.forEach((cpt: CuePoint) => {
                if (cpt.terminal === undefined) return
                const routePoint = routeStore.getPointById(cpt.routePointId)
                const ptIdx = routeStore.getPointIndex(routePoint!)

                if (ptIdx !== brmRange.begin && ptIdx !== brmRange.end) {
                    cpt.terminal = undefined
                    cpt.type = 'cue'
                }
            })

            // 末端のポイントが PC から変更されてしまった場合は強制的に末端に変える
            // 末端ポイントではラジオボタンを消すようにしたのでここには引っかからないはずだが、保険のために
            const beginCpt = routeStore.hasCuePoint(brmRange.begin)
            const endCpt = routeStore.hasCuePoint(brmRange.end)
            if (beginCpt !== null) {
                beginCpt.point.type = 'pc'
                beginCpt.point.terminal = 'start'
            }
            if (endCpt !== null) {
                endCpt.point.type = 'pc'
                endCpt.point.terminal = 'finish'
            }

            // start/finish を持たなくなってしまったときには新設する
            // 両端を含む部分が削除されたり exclude になったときなど
            if (!routeStore.hasCuePoint(brmRange.begin)) {
                const cpt = this.addCuePoint(routeStore.points[brmRange.begin])
                cpt.type = 'pc'
                cpt.terminal = 'start'
            }
            if (!routeStore.hasCuePoint(brmRange.end)) {
                const cpt = this.addCuePoint(routeStore.points[brmRange.end])
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

                // grId を持ってはいるが、前後ともに違うときはグループが解除されたとして grId を undefined にリセットする
                if (grId !== undefined && grId !== _pre && grId !== _post) {
                    _controlList[i].groupId = undefined
                }
            }

            // グループIdの一覧を配列に[0]をグループなしに
            const groupIdArr = [undefined, ...Array.from(groupIdSet)]
            for (const cpt of _controlList) {
                cpt.groupNo = groupIdArr.findIndex(id => cpt.groupId === id)
            }

            // cuePoint.routePointIndex の振り直し
            this.cuePoints.forEach((cpt: CuePoint) => {
                if (cpt.type !== 'poi') {
                    const rpt = routeStore.getPointById(cpt.routePointId)
                    cpt.routePointIndex = routeStore.getPointIndex(rpt!)
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
            const _poiList = this.poiList

            // pointNo （キューシートの一列目の番号）
            _pointList.forEach((cpt, index) => {
                cpt.pointNo = index + 1
            })

            // poiNo（アイコンのラベル付けのために使用）
            _poiList.forEach((cpt, index) => {
                cpt.poiNo = index + 1
            })

            // PC, Check ( PC1A:共有 - CHECK - PC1B:共有 という並びはない. 将来的に CHK の共有ができることも考慮)

            // 1st STEP: それぞれの pcNo, controlNo の割付け（グループは同じ番号）
            let _pcNo = 0, _checkNo = 0, _controlNo = 0
            for (let i = 0, len = _controlList.length; i < len; i++) {
                const _current = _controlList[i]
                const _pre = _controlList[i - 1] ?? { type: undefined, groupId: undefined }
                if (_current.type === 'pc') {
                    // groupId が undef でなく、前の groupId と同じか=>前のPCと同じグループ=>pcNoは同じ
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
            _pointList.forEach((cpt: CuePoint) => {
                const routePoint = brmStore.getPointById(cpt.routePointId)
                cpt.distance = routePoint?.brmDistance
                cpt.roundedDistance = Math.ceil((cpt.distance! / 1000) * 10) / 10
                cpt.lapDistance = (cpt.roundedDistance * 10 - prevRoundedDistance) / 10
                prevRoundedDistance = cpt.roundedDistance * 10

                cpt.roundDistanceString = addZero(cpt.roundedDistance)
                cpt.lapDistanceString = addZero(cpt.lapDistance)
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

        // POI のキューポイント位置の address を設定する
        // address はあくまでもキューシートテーブルで参考に表示するためだけのもの
        async setPoiAddress(id: symbol) {
            const geocoderStore = useGeocodeStore()
            const poi = this.cuePoints.get(id)
            if (!poi || poi.type !== 'poi') return
            const res = await geocoderStore.getData('reverseGeocoder', poi.lat, poi.lng)
            poi.poiAddress = res.data.address ?? ''

            return poi.poiAddress
        },

        // PoiTable で table上を hover したときにidを設定
        // 一定時間後に消灯させる
        setHighlight(id: symbol){
            if(this.highlightTimer){
                window.clearTimeout(this.highlightTimer)
                this.highlightTimer = undefined
            }
            this.highlight = id
            this.highlightTimer = window.setTimeout(()=>{
                this.highlight = undefined
            }, 2000)
        },

        /**
         * Serialize 用のオブジェクトを作成
         * @returns Array
         */
        pack() {

            return Array.from(this.cuePoints.values())
        },
        /**
         * 
         * @param json シリアライズデータからの復元
         */
        async unpack(arr: Array<{
            type: cueType,
            lat: number,
            lng: number,
            routePointIndex: number,
            terminal: 'start' | 'finish' | undefined,
            properties: cueProperties,
            groupNo: number,
            poiAddress?: string,
            timestamp?: number
        }>) {
            const brmStore = useBrmRouteStore()
            const group = new Map<number, symbol | undefined>()
            group.set(0, undefined) // groupNo = 0 は グループなし。あとの番号は順不同で OK

            // データをクリア
            this.cuePoints.clear()

            for (const _cpt of arr) {
                const rptId = _cpt.type === 'poi' ? null : brmStore.points[_cpt.routePointIndex].id
                const cpt = new CuePoint(_cpt.lat, _cpt.lng, _cpt.type, rptId)
                cpt.terminal = _cpt.terminal
                cpt.properties = { ..._cpt.properties }
                if (!group.has(_cpt.groupNo)) { group.set(_cpt.groupNo, Symbol()) }
                cpt.groupId = group.get(_cpt.groupNo)
                cpt.poiAddress = _cpt.poiAddress ?? ''
                cpt.timestamp = _cpt.timestamp ?? Date.now()

                this.cuePoints.set(cpt.id, cpt)
            }

            this.update()
            return

        }
    }
}
)
