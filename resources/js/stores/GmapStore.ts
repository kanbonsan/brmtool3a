import { defineStore } from 'pinia'

type State = {
    center: {
        lat: number,
        lng: number
    },
    zoom: number,
    bounds: {
        north: number | null,
        south: number | null,
        east: number | null,
        west: number | null
    },
    latLngBounds: google.maps.LatLngBounds | null
}

export const useGmapStore = defineStore('gmap', {

    state: (): State => ({

        center: { lat: 35.2517, lng: 137.1146 },
        zoom: 10,
        bounds: { north: null, south: null, east: null, west: null },
        latLngBounds: null,
    })
})
