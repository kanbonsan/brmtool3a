import { defineStore } from 'pinia'

export const useGmapStore = defineStore('gmap', {

    state: () => ({

        center: { lat: 35.2517, lng: 137.1146 },
        zoom: 10,
        bounds: { north: null, south: null, east: null, west: null },
        latLngBounds: null,
    })
})
