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
    pointNo: number | undefined     // POIと初期値は undefined, 都度自動的に振る
    pcNo: number | undefined        // PC(スタート・ゴール除く)に1から振る. 同一グループは同一No
    checkNo: number | undefined     // チェックポイントに1から振る
    controlNo: number | undefined   // PC, CHECK の通し番号. グループを考慮
    pcLabel?: string                // PC, CHECK それぞれ別番号
    controlLabel?: string           // PC, CHECK 通しのラベル

    distance?: number               // そのポイントの brmDistance
    lapDistance?: number            // 直前の cuePoint からの距離

    // マーカーの位置（GPXファイルにも反映）・マーカードラッグ終了時に再設定
    lat: number
    lng: number

    // 対応するルートポイントのid. null のときは'poi'
    routePointId: symbol | null
    // 作成時間. poi の表示順のソートに利用
    timestamp: number

    constructor(lat: number, lng: number, type: cueType = 'poi', routePointId: symbol | null = null) {
        this.id = Symbol()
        this.groupId = undefined
        this.type = type
        this.terminal = undefined
        this.lat = lat
        this.lng = lng
        this.routePointId = routePointId
        this.timestamp = Date.now()
    }

    setPosition(position: google.maps.LatLng) {
        this.lat = position.lat()
        this.lng = position.lng()
    }
}