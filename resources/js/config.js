export const OPENROUTESERVICE_KEY = '5b3ce3597851110001cf624823737dde01734ad793ed885288ab35d0'

// Yahoo API 
// 確認） https://e.developer.yahoo.co.jp/dashboard/app.detail/fzRRGXmzpEykRD0-
export const YOLP_KEY = 'dj00aiZpPUpOTnhlYURJTUoxaCZzPWNvbnN1bWVyc2VjcmV0Jng9NTM-'
// 標高問い合わせの上限ポイント数
export const MAXIMUM_POINTS_OF_QUERY = 1000
// データの有効期限(90日 ms)
export const GEOCODE_DATA_LIFETIME = 90 * 24 * 3600 * 1000
// 府道などをまとめて 'K' にする
export const ALL_PUBLIC_ROAD_SAME_SYMBOL = false
// 経路探索のリミット距離（メートル）
export const MAX_SEEK_DISTANCE = 50 * 1000
// 経路探索のタイムアウト時間（ms）
export const SEEK_TIMEOUT = 1.5 * 1000
// 経路探索のポイント取得用の DouglasPeucker のトレランス値
// 実験の結果 300km コースで 300ポイントぐらいになった
export const GEOCODE_TOLERANCE = 20 * 0.00005

// 距離計算時の補正倍率 RideWithGps と カシミール3D での距離を元に.
export const HubenyCorrection = 1.0013

// パス上の mouseover イベントでポイントにスナップする範囲（ピクセル）
export const NeighborThreshold = 10

// PoiEdit
export const DefaultGarminIcon = 'Pin, Blue'
export const DefaultGarminPoiIcon = 'Flag, Green'

// SessionStorage に保存するスナップショットの最大容量
export const SNAPSHOTS_LIMIT = 2 * 1000 * 1000  // bytes

// 道路規制情報の有効期限(秒)
export const ROAD_REGULATION_EXPIRE_SECOND = 24 * 3600

// キューシート
// スタート時間のタイムリミット(分)
export const CUESHEET_START_LIMIT = 30

// キューポイント編集時のストリートビューの視点が遠すぎないようにするための距離
export const STREETVIEW_VIEWPOINT_MAX_DISTANCE = 50

// PC / Check のサブグループの命名
export const PC_SUBGROUP_ENUM = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']
