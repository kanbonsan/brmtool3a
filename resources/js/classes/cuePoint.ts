type cueType = 'cue' | 'pc' | 'pass' | 'poi'

export class CuePoint {

    id: symbol
    type: cueType
    // マーカーの位置（GPXファイルにも反映）・マーカードラッグ終了時に再設定
    lat: number
    lng: number
    // 対応するルートポイントのid. null のときは'poi'
    routePointId: symbol | null
    // 作成時間. poi の表示順のソートに利用
    timestamp: number
    // 設定時のルートポイントの距離を覚えておく
    // キューポイントから poi にしたとき、poi からキューポイントに戻すときの位置推定やソートに利用
    // Infinity は JSON.stringify() で null になるので利用できない
    routeDistance: number

    constructor(lat: number, lng: number, type: cueType = 'poi', routePointId: symbol | null = null, routeDistance: number = Number.MAX_SAFE_INTEGER) {
        this.id = Symbol()
        this.type = type
        this.lat = lat
        this.lng = lng
        this.routePointId = routePointId
        this.timestamp = Date.now()
        this.routeDistance = routeDistance
    }

    setPosition(position: google.maps.LatLng) {
        this.lat = position.lat()
        this.lng = position.lng()
    }
    // 対応するルートポイントの付替え
    setRoutePoint(newId: symbol | null, routeDistance?: number) {
        this.routePointId = newId
        if (routeDistance) {
            this.routeDistance = routeDistance
        }
    }
    setType(newType:cueType){
        this.type = newType
    }
}