export type cueType = 'cue' | 'pc' | 'pass' | 'poi'

export type cueProperties = {
    type?: cueType
    signal: boolean     // 信号の有無
    crossing: string    // 交差点記号
    name: string        // 名称
    direction: string   // 進行方向
    route: string       // 経路
    note: string        // 備考
    garminDeviceIcon: string    // アイコン名
    garminDeviceText: string    // デバイスに表示するテキスト
    garminDisplay: boolean       // デバイスにアイコンを表示するか
}

export class CuePoint {

    id: symbol
    type: cueType
    terminal?: 'start' | 'finish'

    properties: cueProperties = {
        signal: false,
        crossing: '',
        name: '',
        direction: '',
        route: '',
        note: '',
        garminDeviceIcon: '',
        garminDeviceText: '',
        garminDisplay: true
    }

    groupId: symbol | undefined     // 同一 ID は同じグループに（default は undefined）
    groupNo: number                 // serialize / unserialize 用に番号も振っておく（cuesheetStore.update()で更新）
    pointNo: number | undefined     // POIと初期値は undefined, 都度自動的に振る 0:groupId=undefined, 1から順にグループ
    pcNo: number | undefined        // PC(スタート・ゴール除く)に1から振る. 同一グループは同一No
    checkNo: number | undefined     // チェックポイントに1から振る
    controlNo: number | undefined   // PC, CHECK の通し番号. グループを考慮
    pcLabel?: string                // PC, CHECK それぞれ別番号
    controlLabel?: string           // PC, CHECK 通しのラベル

    distance?: number               // そのポイントの brmDistance
    roundedDistance?: number         // キューシート表示用の丸めた距離（km）
    lapDistance?: number            // 直前の cuePoint からの距離・roundedDistanceから計算
    roundDistanceString?: string    // 表示用に小数1桁を0に
    lapDistanceString?: string

    openMin?: number                // PCオープン（分）
    closeMin?: number               // PCクローズ（分）

    // マーカーの位置（GPXファイルにも反映）・マーカードラッグ終了時に再設定
    lat: number
    lng: number

    // 対応するルートポイントのid. null のときは'poi'
    routePointId: symbol | null
    routePointIndex: number | undefined // serialize / unserialize 用に対応するルートポイントIndexを記憶しておく（cuesheetStore.update()で更新）
    // 作成時間. poi の表示順のソートに利用
    timestamp: number

    constructor(lat: number, lng: number, type: cueType = 'poi', routePointId: symbol | null = null) {
        this.id = Symbol()
        this.type = type
        this.terminal = undefined
        this.groupId = undefined
        this.groupNo = 0
        this.pointNo = undefined
        this.checkNo = undefined
        this.controlNo = undefined
        this.pcLabel = ''
        this.controlLabel = ''
        this.distance = undefined
        this.lapDistance = undefined
        this.lat = lat
        this.lng = lng
        this.routePointId = routePointId
        this.timestamp = Date.now()
        this.openMin = undefined
        this.closeMin = undefined
    }

    setPosition(position: google.maps.LatLng) {
        this.lat = position.lat()
        this.lng = position.lng()
    }
    
    // 信号・交差点 を結合
    get cuesheetName(): string {
        const signal: string = this.properties.signal ? 'S ' : ''
        const crossing: string = this.properties.crossing !== '' ? `${this.properties.crossing} ` : ''
        return `${signal}${crossing}${this.properties.name}`
    }
}