import { defineStore } from 'pinia'

type MapMode = 'edit' | 'subpath' | 'subpathSelect' | 'subpathEdit' | 'subpathDirection' | 'subpathDirectionConfirm'
type MapLock = null | 'cuePoint' | 'subpath'


type State = {
    map: google.maps.Map | null
    ready: boolean
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
    latLngBounds: google.maps.LatLngBounds | undefined, // 現状の BoundingBox
    zoomBounds: google.maps.LatLngBounds| undefined,    // ここに BB をセットすると、MapPane で watch していて範囲が変わる

    mapMode: MapMode,
    mapLock: MapLock,
}

export const useGmapStore = defineStore('gmap', {

    state: (): State => ({
        map: null,
        ready: false,
        center: { lat:35.24385944989924, lng: 137.09019885128768},
        zoom: 10,
        bounds: { north: undefined, south: undefined, east: undefined, west: undefined },
        latLngBounds: undefined,
        zoomBounds: undefined,

        mapMode: 'edit',
        mapLock: null,
        
    }),

    getters: {
        mode: (state) => state.mapMode,
        lock: (state) => state.mapLock,

        editMode: (state) => state.mapMode === 'edit',
        subpathMode: (state) => state.mapMode === 'subpath',
        subpathSelectMode: (state) => state.mapMode === 'subpathSelect',
        subpathEditMode: (state) => state.mapMode === 'subpathEdit',
        subpathDirectionMode: (state) => state.mapMode === 'subpathDirection',
        subpathDirectionConfirmMode: (state) => state.mapMode === 'subpathDirectionConfirm'

    },

    actions: {
        setMode(mode: MapMode) {
            this.mapMode = mode
        },

        setCenter(pos: { lat: number, lng: number } | google.maps.LatLng) {
            if (pos instanceof google.maps.LatLng) {
                this.center = { lat: pos.lat(), lng: pos.lng() }
            } else {
                this.center = { lat: pos.lat, lng: pos.lng }
            }
        },

        setZoomBoundingBox( bb: google.maps.LatLngBounds){
            this.zoomBounds = bb
        }

    }
})
