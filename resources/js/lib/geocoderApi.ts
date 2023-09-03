/**
 * 各種APIをたたく YOLP, GoogleMaps Geocoder
 */
import { GEOCODE_DATA_LIFETIME, ALL_PUBLIC_ROAD_SAME_SYMBOL } from '@/config'
import axios from 'axios'
import _ from 'lodash'
import jsonpAdapter from 'axios-jsonp'

const YOLP_KEY = import.meta.env.YOLP_KEY

const wait = (ms: number) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

// データをキャッシュするにあたり座標を丸める。この値をインデックスに用いて、
// 近隣の点を API に呼びに行かないようにする。
// BRMTOOL2 では小数点以下 3桁で丸めたが 4桁に増やした。

const code = (_num: number, round: number, add: number, digit: number) => {
    const _approx: number = Math.round((_num) * Math.pow(10, round))
    const _addedApprox: number = Math.round((_num + add) * Math.pow(10, round))

    const code = ('0000000000' + _addedApprox.toString()).slice(-digit)
    const upper = _approx.toString().slice(0, _approx.toString().length - round)
    const lower = _approx.toString().slice(-round)
    const approx = parseFloat(upper + "." + lower)

    return { code, upper, lower, approx, raw: _num }
}

export function approx(_lat: number, _lng: number) {

    // 赤道上で 40000 x 1000 m / 360° / 10000 = 11.1m (小数点以下 4桁で約11メートル)
    // なので小数点以下 4桁で丸めておく。
    const lat = code(_lat, 4, 90, 7)
    const lng = code(_lng, 4, 180, 7)

    return { locationCode: lat.code + ":" + lng.code, val: { lat: lat.approx, lng: lng.approx }, raw: { lat: lat.raw, lng: lng.raw } }
}

// キューシート用の道路名に変換
// config.js で ALL_PUBLIC_ROAD_SAME_SYMBOL を設定して、
// 都道府県道をすべて Knnn で表示する
export function convRoadName(name: string) {

    if (typeof name !== 'string') {
        return name
    }

    const pubRoad = /国道|県道|府道|道道|都道/
    const roadNum = /(国道|県道|府道|道道|都道)([０-９]+)(号線)/

    const replacer = (match: any, p1: string, p2: string, p3: any) => {
        const same = ALL_PUBLIC_ROAD_SAME_SYMBOL
        let kigou
        switch (p1) {
            case '国道':
                kigou = "R"
                break
            case "県道":
                kigou = same ? "K" : "K"
                break
            case "府道":
                kigou = same ? "K" : "F"
                break
            case "道道":
                kigou = same ? "K" : "D"
                break
            case "都道":
                kigou = same ? "K" : "T"
                break
        }

        return kigou + p2.replace(/[０-９]/g, (s) => {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
        })
    }

    // 国道・県道でなければ変換しない
    if (!name.match(pubRoad)) {
        return name
    }

    return name.replace(roadNum, replacer)
}


// Yahoo Reverse Geocoder
// adress, country, road
export async function yolp_reverseGeocoder(lat: number, lng:number) {

    const api = 'yahooReverseGeocoder'

    const URL = "https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder"

    try {

        const response = await axios(
            {
                method: 'get',
                url: URL,
                adapter: jsonpAdapter,
                timeout: 3000,
                params: {
                    appid: YOLP_KEY,
                    lat: lat,
                    lon: lng,   // lng ではない！
                    output: 'json'
                }
            }
        )

        const result = response.data.Feature[0].Property
        const Country = result.Country
        const Address = result.Address

        // 道路情報がない場合は仮の情報を追加
        result.Road = result.Road ?? [{ Name: "市道", Kigou: "市道" }]
        const road = result.Road.map((rd: any) => {
            return ({ ...rd, Kigou: convRoadName(rd.Name) })
        })

               return ({ api, road, rawData: result })

    } catch (error) {
        console.error('yolp_reverseGeocoder', error)
        throw error

    }

}

export async function yolp_placeInfo(lat:number,lng:number) {

    const api = 'yahooPlaceInfo'
    const URL = "https://map.yahooapis.jp/placeinfo/V1/get"

    try {
        const response = await axios(
            {
                method: 'get',
                url: URL,
                adapter: jsonpAdapter,
                timeout: 3000,
                params: {
                    appid: YOLP_KEY,
                    lat: lat,
                    lon: lng,
                    output: 'json'
                }
            }
        )
        const result = response.data.ResultSet

        const Address = result.Address
        const Country = result.Country
        const category_control = ["道の駅", "ローソン", "セブン-イレブン", "ファミリーマート", "ミニストップ", "ヤマザキデイリーストアー"]
        const crossing: string[] = []
        const control: string[] = []

        result.Result.forEach((pt: any) => {
            if (pt.Category === '地点名' && pt.Name.indexOf('交差点') !== -1) {
                crossing.push(pt.Name.replace(/交差点$/, ''))
                return
            }
            if (category_control.includes(pt.Category)) {
                control.push(pt.Name)
            }
        })

        return { api, crossing, control, rawData: result }

    } catch (error) {

        throw error
    }
}
