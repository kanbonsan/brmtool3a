import { defineStore } from 'pinia'

type State = {
    map: google.maps.Map | null
    center: {
        lat: number,
        lng: number
    },
    zoom: number,
    bounds: {
        north: number | undefined,
        south: number | undefined,
        east: number | undefined,
        west: number | undefined
    },
    latLngBounds: google.maps.LatLngBounds | undefined
}

export const useGmapStore = defineStore('gmap', {

    state: (): State => ({
        map: null,
        center: { lat: 35.2517, lng: 137.1146 },
        zoom: 10,
        bounds: { north: undefined, south: undefined, east: undefined, west: undefined },
        latLngBounds: undefined,
    }),
})
