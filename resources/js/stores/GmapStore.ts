import { defineStore } from 'pinia'

type MapMode = 'edit' | 'subpath' | 'subpathSelect' | 'subpathEdit' | 'subpathDirection' | 'subpathDirectionConfirm'
type MapLock = null | 'cuePoint' | 'subpath'


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
    latLngBounds: google.maps.LatLngBounds | undefined,

    mapMode: MapMode,
    mapLock: MapLock,
}

export const useGmapStore = defineStore('gmap', {

    state: (): State => ({
        map: null,
        center: { lat: 35.2517, lng: 137.1146 },
        zoom: 10,
        bounds: { north: undefined, south: undefined, east: undefined, west: undefined },
        latLngBounds: undefined,

        mapMode: 'edit',
        mapLock: null,
    }),

    getters: {
        mode: (state) => state.mapMode,
        lock: (state) => state.mapLock,

        editMode: (state) => state.mapMode === 'edit',
        subpathMode: (state) => state.mapMode === 'subpath',
        subpathSelectMode: (state) => state.mapMode === 'subpathSelect',
        subpathEditMode: (state)=>state.mapMode === 'subpathEdit',
        subpathDirectionMode: (state)=>state.mapMode === 'subpathDirection',
        subpathDirectionConfirmMode: (state)=>state.mapMode === 'subpathDirectionConfirm'

    },

    actions: {
        setMode(mode: MapMode) {
            this.mapMode = mode
        },

    }
})
