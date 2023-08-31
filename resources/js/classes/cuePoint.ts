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
    garminDisplay:boolean       // デバイスにアイコンを表示するか
}

export class CuePoint {

    id: symbol
    type: cueType

    properties: cueProperties = {
        signal: false,
        crossing: '',
        name:'',
        direction:'',
        route:'',
        note:'',
        garminDeviceIcon:'',
        garminDeviceText:'',
        garminDisplay:true
    }
    
    groupId: symbol             // 同一 ID は同じグループに（default は id と同じ）
    pointNo: number | undefined // POIと初期値は undefined, 都度自動的に振る
    pcLabel?: string             //

    distance?: number           // そのポイントの brmDistance
    lapDistance?: number        // 直前の cuePoint からの距離

    // マーカーの位置（GPXファイルにも反映）・マーカードラッグ終了時に再設定
    lat: number
    lng: number

    // 対応するルートポイントのid. null のときは'poi'
    routePointId: symbol | null
    // 作成時間. poi の表示順のソートに利用
    timestamp: number

    constructor(lat: number, lng: number, type: cueType = 'poi', routePointId: symbol | null = null) {
        this.id = this.groupId = Symbol()
        this.type = type
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