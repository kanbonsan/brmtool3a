import { defineStore } from 'pinia'
import { approx, yolp_reverseGeocoder, yolp_placeInfo } from '@/lib/geocoderApi'
import { GEOCODE_CACHE_LIMIT } from '@/config'

type cache = {
    ts: number,
    code: string,
    data: any
}

type State = {
    reverseGeocoder: cache[],
    placeInfo: cache[],
}

export const useGeocodeStore = defineStore('geocode', {

    state: (): State => ({
        reverseGeocoder: [],
        placeInfo: []
    }),

    persist: true,

    getters: {

        reverseGeocoderMap: (state) => {
            return new Map(state.reverseGeocoder.map((item: cache) => [item.code, item.data]))
        },

        placeInfoMap: (state) => {
            return new Map(state.placeInfo.map((item: cache) => [item.code, item.data]))
        },

    },

    actions: {

        async getReverseGeocoder(lat: number, lng: number) {
            console.log(this.$id)
            console.log(localStorage.getItem('geocode')!.length)
            const { code, val } = approx(lat, lng)
            if (this.reverseGeocoderMap.has(code)) {
                return { status: 'cached', data: this.reverseGeocoderMap.get(code) }
            } else {
                try {
                    const data = await yolp_reverseGeocoder(val.lat, val.lng)
                    this.reverseGeocoder.push({ ts: Date.now(), code, data })
                    return { status: 'oti', data }
                } catch (e) {
                    return { status: 'error' }
                }
            }

        },

        async getPlaceInfo(lat: number, lng: number) {
            const { code, val } = approx(lat, lng)
            if (this.reverseGeocoderMap.has(code)) {
                return { status: 'cached', data: this.reverseGeocoderMap.get(code) }
            } else {
                try {
                    const data = await yolp_placeInfo(val.lat, val.lng)
                    this.reverseGeocoder.push({ ts: Date.now(), code, data })
                    return { status: 'oti', data }
                } catch (e) {
                    return { status: 'error' }
                }
            }

        },

    }

})