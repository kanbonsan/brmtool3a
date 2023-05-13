export class RoutePoint {
    /** v-for の key に用いる一意な ID */
    id: Symbol;
    /** latitude 緯度 */
    lat: number = 0.0;
    /** longitude 経度 */
    lng: number = 0.0;
    /** altitude 標高(m)*/
    alt?: number;

    /** 除外ポイントかどうか */
    excluded: boolean = false;
    /** 編集ポイントかどうか */
    editable: boolean = false;
    /** ポイントの表示優先度 */
    weight: number = 1;
    /** ユーザーが参照点に設定したか */
    voluntary: boolean = false;

    /** 前の点からの距離（ポイントの増減時でも部分的な更新に留めるために保持） メートル */
    pointDistance: number = 0.0;
    /** 全行程の積算距離（除外部分を含む）メートル*/
    routeDistance: number = 0.0;
    /** 除外部分を除くブルベ距離 メートル */
    brmDistance: number = 0.0;

    constructor(lat: number = 0.0, lng: number = 0.0, alt?: number) {
        this.id = Symbol();
        this.lat = lat;
        this.lng = lng;
        this.alt = alt;
    }

    /** 複製したポイントを返す. ID は新たに振る */
    clone() {
        return new RoutePoint(this.lat, this.lng, this.alt);
    }
}
