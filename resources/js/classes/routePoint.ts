export class RoutePoint {
    /** v-for の key に用いる一意な ID */
    id: symbol
    /** latitude 緯度 */
    lat: number
    /** longitude 経度 */
    lng: number
    /** altitude 標高(m)*/
    alt: number
    smoothAlt: number

    /** 除外ポイントかどうか */
    excluded: boolean = false;
    /** 編集ポイントかどうか */
    editable: boolean = true;

    /** ポイントの表示優先度 voluntary point は 20(以上)*/
    weight: number = 1;
    /** 標高キャッシュ済みか */
    demCached: boolean = false;

    /** 標高を修正済みか（強制書き換えでない限り以降書き換えない） */
    altCorrected: boolean = false;
    altSmoothed: boolean = false;

    /** 前の点からの距離（ポイントの増減時でも部分的な更新に留めるために保持） メートル */
    pointDistance: number = 0.0;
    /** 全行程の積算距離（除外部分を含む）メートル*/
    routeDistance: number = 0.0;
    /** 除外部分を除くブルベ距離 メートル */
    brmDistance: number = 0.0;

    /** 前後の点との斜度 */
    preSlope: number = 0.0;
    postSlope: number = 0.0;

    /** 透明度 */
    opacity: number = 0.0;

    constructor(lat: number = 0.0, lng: number = 0.0, alt: number = 0.0) {
        this.id = Symbol()
        this.lat = lat
        this.lng = lng
        this.alt = alt
        this.smoothAlt = alt
    }

    /** 複製したポイントを返す. ID は新たに振る */
    clone() {
        return new RoutePoint(this.lat, this.lng, this.alt)
    }
}
