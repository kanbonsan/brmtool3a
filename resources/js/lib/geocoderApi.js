/**
 * 各種APIをたたく YOLP, GoogleMaps Geocoder
 */
import { GEOCODE_DATA_LIFETIME, ALL_PUBLIC_ROAD_SAME_SYMBOL } from '@/config'
import { MAXIMUM_POINTS_OF_QUERY } from '@/config'
import axios from 'axios'
import jsonpAdapter from 'axios-jsonp'
import _ from 'lodash'

const YOLP_KEY = import.meta.env.YOLP_KEY

const wait = (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

// データをキャッシュするにあたり座標を丸める。この値をインデックスに用いて、
// 近隣の点を API に呼びに行かないようにする。
// BRMTOOL2 では小数点以下 3桁で丸めたが 4桁に増やした。

export function getApproxCoord(lat, lng) {
    // 赤道上で 40000 x 1000 m / 360° / 10000 = 11.1m (小数点以下 4桁で約11メートル)
    // なので小数点以下 4桁で丸めておく。
    const _lng = Math.round((lng + 180) * 10000)    // 0～360_0000
    const _lat = Math.round((lat + 90) * 10000)     // 0～180_0000

    return ("0000000" + _lng.toString()).slice(-7) + ':' + ("0000000" + _lat.toString()).slice(-7)
}

// キューシート用の道路名に変換
// config.js で ALL_PUBLIC_ROAD_SAME_SYMBOL を設定して、
// 都道府県道をすべて Knnn で表示する
export function convRoadName(name) {

    if (typeof name !== 'string') {
        return name
    }

    const pubRoad = /国道|県道|府道|道道|都道/
    const roadNum = /(国道|県道|府道|道道|都道)([０-９]+)(号線)/

    const replacer = (match, p1, p2, p3) => {
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
export async function yolp_reverseGeocoder(point) {

    const type = 'yahooReverseGeocoder'

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
                    lat: point.lat(),
                    lon: point.lng(),   // lng ではない！
                    output: 'json'
                }
            }
        )

        const ts = Date.now()
        const result = response.data.Feature[0].Property
        const Country = result.Country
        const Address = result.Address

        // 道路情報がない場合は仮の情報を追加
        result.Road = result.Road || [{ Name: "", Kigou: "" }]
        const Road = result.Road.map(rd => {
            return ({ ...rd, Kigou: convRoadName(rd.Name) })
        })

        const data = { Address, Country, Road, ts }

        return ({ type, location, data, ts })

    } catch (error) {
        console.error('yolp_reverseGeocoder', error)
        throw error

    }

}

async function yolp_placeInfo(point) {
    const type = 'yahooPlaceInfo'
    const location = point.getApproxCoord()
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
                    lat: point.lat(),
                    lon: point.lng(),
                    output: 'json'
                }
            }
        )
        const ts = Date.now()
        const result = response.data.ResultSet

        const Address = result.Address
        const Country = result.Country
        const category_control = ["道の駅", "ローソン", "セブン-イレブン", "ファミリーマート", "ミニストップ", "ヤマザキデイリーストアー"]
        const Crossing = []
        const Control = []

        result.Result.forEach(pt => {
            if (pt.Category === '地点名' && pt.Name.indexOf('交差点') !== -1) {
                Crossing.push(pt.Name.replace(/交差点$/, ''))
                return
            }
            if (category_control.includes(pt.Category)) {
                Control.push(pt.Name)
            }
        })

        const data = { Address, Country, Crossing, Control, ts }

        return ({ status: 'ok', type, location, data, ts })

    } catch (error) {

        throw error
    }
}

/**
 * Reverse Geocoder YOLP API から情報を取ってくる
 * @param {Brmtool.Point} point 
 * @param {Boolean} forceCall / Lock/unlock を無視して読み込みに行くか
 * @returns {Object} { Address, Country, Road }
 */
export async function reverseGeocoder(point, forceCall = false) {

    const type = 'yahooReverseGeocoder'

    // 緯度・経度を小数以下 3桁で丸めて近隣のポイントをまとめる。だいたい直径 100m 程度におさまる
    // Brmtool.js で定義
    const location = point.getApproxCoord()
    const local = store.getters['cache/getData'](type, location)

    if (local) {

        // ローカルのキャッシュの有効期限を調べる（persistent 化してデータが残っていたりしたときのための処置）
        if (local.ts + GEOCODE_DATA_LIFETIME > Date.now()) {
            console.log(`${type}: cache hit`)
            return { ...local.data, source: 'local' }
        } else {
            console.log(`${type}: cache expired`)
        }
    }

    // local （クライアント）にデータがない・または古い

    // unlock を待って、即 lock する
    if (forceCall !== true) {
        try {
            await store.dispatch('cache/unlocked', { type, timeout: 20000 })
        } catch (e) {
            throw new Error(`${type}: ${e}`)
        }
    }

    try {
        // 強制検索でもロックをかけておくために再度ロック処理
        analyzeLock(type)
        console.log(`${type}: querying server`)

        const ts = Date.now()

        const result = await yolp_reverseGeocoder(point)    // { type, location, data, ts }
        // Laravel での API 呼び出しの制限に対応
        // App/Http/Kernel.php の 'throttle:60,1' を 'throttle:300,1'（1秒間に300回＝200ms/回）に緩和
        const waitMs = 205 - (Date.now() - ts)

        await wait(waitMs)

        store.dispatch('cache/store', {
            type,
            location,
            data: result.data,
            ts: result.ts
        })

        return { ...result.data, source: 'api' }

    } catch (e) {
        console.error(`${type}: query error`)
        return `${type}: query error + ${e.message}` //null

    } finally {

        analyzeUnlock(type)
    }
}


// 交差点情報はリバースジオコーダーよりコチラのほうがよい

export async function placeInfo(point, forceCall = false) {
    const type = 'yahooPlaceInfo'
    const location = point.getApproxCoord()
    const local = store.getters['cache/getData'](type, location)

    if (local) {

        if (local.ts + GEOCODE_DATA_LIFETIME > Date.now()) {
            console.log(`${type}: cache hit`)
            return { ...local.data, source: 'local' }
        } else {
            console.log(`${type}: cache expired`)
        }
    }

    if (!forceCall) {
        try {
            await store.dispatch('cache/unlocked', { type, timeout: 20000 })
        } catch (e) {
            throw new Error(`${type}: ${e}`)
        }
    }

    try {
        analyzeLock(type)
        console.log(`${type}: querying server`)

        const result = await yolp_placeInfo(point)

        store.dispatch('cache/store', {
            type,
            location,
            data: result.data,
            ts: result.ts
        })

        return { ...result.data, source: 'api' }

    } catch (e) {
        console.error(`${type}: query error`)
        return null
    } finally {
        analyzeUnlock(type)
    }
}

// YOLP で表データを取得
// <LatLng> の配列
async function partGetAltitude(points) {

    if (points.length > 40) {
        throw new Error('ERROR: partGetAltitude; 一度に申し込めるのは 40点までです.')
    }

    const URL = "https://map.yahooapis.jp/alt/V1/getAltitude"

    let coordinates = ''
    points.forEach(pt => {
        coordinates += pt.lng().toFixed(5) + ','
        coordinates += pt.lat().toFixed(5) + ','
    })

    const response = await axios({
        method: 'get',
        url: URL,
        adapter: jsonpAdapter,
        timeout: 3000,
        params: {
            appid: YOLP_KEY,
            coordinates,
            output: 'json'
        }
    }).catch(response => {
        throw new Error(response)
    })

    return response.data.Feature.map((pt) => pt.Property.Altitude)

}

export async function getAltitude(points) {

    if (points.length > MAXIMUM_POINTS_OF_QUERY) {
        throw new Error(`Queryが上限ポイント数 ${MAXIMUM_POINTS_OF_QUERY} を超えました: ${points.length}`)
    }

    const chunks = _.chunk(points, 40)
    let result = []
    let chunkResult
    for (let i = 0, len = chunks.length; i < len; i++) {
        chunkResult = await partGetAltitude(chunks[i]).catch(() => { throw new Error() })
        result = result.concat(chunkResult)
    }
    return result

}

// Google Map のジオコーダー API はローマ字で返してくるので使えない
export async function gmapReverseGeocoder(point, forceCall = false) {
    const type = 'gmapReverseGeocoder'
    const location = point.getApproxCoord()

    const local = store.getters['cache/getData'](type, location)

    if (local) {

        if (data.ts + GEOCODE_DATA_LIFETIME > Date.now()) {
            console.log('GmapGeocoder: hit cache')
            return local
        } else {
            console.log('but local cache is expired...')
        }
    }

    // unlock を待って、即 lock する
    const geocoder = new google.maps.Geocoder()
    const response = await geocoder.geocode({ location: point })

    store.dispatch('cache/store', {
        type, location, response
    })

    return response || null
}




