// 世界座標系（ピクセル座標）と地図座標（緯度・経度）間の変換
// 「世界は１枚の画像から : グーグルマップのしくみを探る」
// https://www.mapli.net/blogs/google-maps-mechanism/how-google-map-works1/

// 世界座標系は、縦横 256 x 256 (ピクセル) が基本となって、ズームが増えるごとに 縦横が倍々になっていく。
//
// EPSG: 3857 というのがあって、これもメルカトル図法だが、こちらは zoom は考慮せずに、単位は メートル であるらしい。
// 関東甲信越の道路規制状況を取ってくると、EPSG:3857 が使われているので少し勉強した。

import { hubeny } from "@/lib/hubeny"

const R = 128.0 / Math.PI

const deg2rad = function (deg: number) {
    return (deg / 180) * Math.PI
}

const rad2deg = function (rad: number) {
    return (180 * rad) / Math.PI
}

/**
 * 緯度・経度を世界座標に変換（ズームを考慮）
 * @param {Number} latDeg 緯度（度）
 * @param {Number} lngDeg 経度（度）
 * @param {Number} zoom Gmap のズーム値 デフォルト: 0
 * @returns {x, y} 世界座標（ピクセル座標）
 */
export const worldCoord = function (latDeg: number, lngDeg: number, zoom = 0) {
    const lat = deg2rad(latDeg)
    const lng = deg2rad(lngDeg)
    return {
        x: R * (lng + Math.PI) * Math.pow(2, zoom),
        y: (-(R / 2) * Math.log((1 + Math.sin(lat)) / (1 - Math.sin(lat))) +
            128) *
            Math.pow(2, zoom)
    }
}

/**
 * 世界座標を緯度・経度に変換
 * @param {Number} x 横軸ピクセル
 * @param {Number} y 縦軸ピクセル
 * @param {Number} zoom ズーム値
 * @returns {lat, lng} 緯度・経度（単位は度）
 */
export const pixelCoord = function (x: number, y: number, zoom = 0) {

    const worldX = x / Math.pow(2, zoom)
    const worldY = y / Math.pow(2, zoom)

    const lng = worldX / R - Math.PI
    const lat = Math.atan(Math.sinh((128 - worldY) / R))

    return {
        lat: rad2deg(lat),
        lng: rad2deg(lng)
    }
}
/**
 * その地点・ズーム値における 1ピクセル分の長さ
 * @param {Number} lat 緯度
 * @param {Number} lng 経度
 * @param {Number} zoom 
 * @returns {latDiff, lngDiff, xDiff, yDiff, avgDiff, diffFactor} 1ピクセルあたりの緯度・経度の差、横軸・縦軸・平均の距離（メートル）, 少数以下何桁から
 */
export const pixelDiff = function (lat: number, lng: number, zoom = 0) {

    // その位置の世界座標を取得
    const world = worldCoord(lat, lng, zoom)
    // その latLng における 1ピクセルづつずれた位置の latLng を取得
    const latLngByOnePixel = pixelCoord(world.x + 1, world.y + 1, zoom)

    const latDiff = Math.abs(latLngByOnePixel.lat - lat)
    const lngDiff = Math.abs(latLngByOnePixel.lng - lng)

    const diffFactor = Math.ceil(Math.max(Math.log10(1 / latDiff), Math.log10(1 / lngDiff)))

    const xDiff = hubeny(lat, lng, lat, latLngByOnePixel.lng)
    const yDiff = hubeny(lat, lng, latLngByOnePixel.lat, lng)
    const avgDiff = (xDiff + yDiff) / 2

    return {
        latDiff,
        lngDiff,
        diffFactor,
        xDiff,
        yDiff,
        avgDiff
    }
}

// 以下 https://gist.github.com/onderaltintas/6649521 より

/**
 * EPSG 3857 (Mercator) ⇒ EPSG 4326 (WGS84)
 * @param {*} x (経度方向)メートル
 * @param {*} y (緯度方向)メートル
 * @returns { lat, lng } degree
 */
export const epsg3857to4326 = function (x: number, y: number) {
    const lng = x * 180 / 20037508.34
    const lat = Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90
    return { lat, lng }
}
/**
 * EPSG 4326 ⇒ EPSG 3857
 * @param {*} lat degree
 * @param {*} lng degree
 * @returns { x, y } meters
 */
export const epsg4326to3857 = function (lat: number, lng: number) {
    const x = lng * 20037508.34 / 180
    const y = (Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)) * 20037508.34 / 180
    return { x, y }
}

/**
 * その地点で緯度・経度と距離の関係
 * @param {*} lat 
 * @param {*} lng 
 * @param {*} diff デフォルト値 1/1000度
 * @returns X軸（経度方向）・Y軸（緯度方向）それぞれ 1/1000度 あたりのメートル
 */
export const deltaCoordToDistance = function (lat: number, lng: number, diff = 0.001) {
    const x = hubeny(lat, lng, lat, lng + diff)
    const y = hubeny(lat, lng, lat + diff, lng)
    return ({ x, y })
}

/**
 * その地点での距離あたりの緯度・経度の差
 * @param {*} lat 
 * @param {*} lng 
 * @param {*} diff デフォルト値 100m
 * @returns 緯度経度の差（degree）
 */
export const deltaDistanceToCoord = function (lat: number, lng: number, diff = 100) {
    const delta = deltaCoordToDistance(lat, lng) // 0.001 度あたりの距離
    return ({ dLat: diff / delta.y * 0.001, dLng: diff / delta.x * 0.001 })
}
