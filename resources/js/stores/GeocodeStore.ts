import { defineStore } from 'pinia'
import { approx, yolp_reverseGeocoder, yolp_placeInfo } from '@/lib/geocoderApi'
import { GEOCODE_CACHE_LIMIT } from '@/config'

type cache = {
    ts: number,
    code: string,
    data: any
}

type State = {
    cache: cache[]
}

interface Api {
    fn(lat: number, lng: number): Promise<any>,
    prefix: string
}

type Apis = { [name: string]: Api }

const apis: Apis = {
    reverseGeocoder: {
        fn: yolp_reverseGeocoder,
        prefix: 'rev'
    },
    placeInfo: {
        fn: yolp_placeInfo,
        prefix: 'place'
    }
}

export const useGeocodeStore = defineStore('geocode', {

    state: (): State => ({
        cache: []
    }),

    persist: true,

    getters: {
        // 検索しやすいため Map オブジェクトに（localStrageに保存するには本体は Array にしておく必要がある）
        cacheMap: (state) => {
            return new Map(state.cache.map((item: cache) => [item.code, item.data]))
        },

    },

    actions: {

        async getData(_method: string, lat: number, lng: number) {
            const api = apis[_method]
            const { locationCode, val } = approx(lat, lng)

            const code = api.prefix + ":" + locationCode
            if (this.cacheMap.has(code)) {
                return { status: 'cached', data: this.cacheMap.get(code) }
            } else {
                try {
                    const data = await (api.fn)(val.lat, val.lng)
                    this.cache.push({ ts: Date.now(), code, data })
                    this.gc()
                    return { status: 'oti', data }
                } catch (e) {
                    return { status: 'error' }
                }
            }
        },

        gc(){
            const length = JSON.stringify(this.cache).length
            if( length<GEOCODE_CACHE_LIMIT) return
            this.cache.shift()
            this.gc()
        }

    }

})