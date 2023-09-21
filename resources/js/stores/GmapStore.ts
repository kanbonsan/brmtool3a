import { defineStore } from 'pinia'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'

type MapMode = 'edit' | 'subpath' | 'subpathSelect' | 'subpathEdit' | 'subpathDirection' | 'subpathDirectionConfirm'
type MapLock = null | 'cuePoint' | 'subpath'

export type GuideMarker = {
    key: symbol
    position: google.maps.LatLng | google.maps.LatLngLiteral
    icon?: google.maps.Icon
}

type State = {
    map: google.maps.Map | null
    ready: boolean
    center: {
        lat: number,
        lng: number
    },
    zoom: number | undefined,
    bounds: {
        north: number | undefined,
        south: number | undefined,
        east: number | undefined,
        west: number | undefined
    },
    latLngBounds: google.maps.LatLngBounds | undefined, // 現状の BoundingBox
    zoomBounds: google.maps.LatLngBounds | undefined,    // ここに BB をセットすると、MapPane で watch していて範囲が変わる

    mapMode: MapMode,
    mapLock: MapLock,

    streetView: {
        panorama: google.maps.StreetViewPanorama | undefined
        position: google.maps.LatLng | google.maps.LatLngLiteral | null
        pov: google.maps.StreetViewPov
        zoom: number
    },

    guideMarkers: Array<GuideMarker>,
    infoMarker?: { marker: GuideMarker, routePoint: RoutePoint }

}


export const useGmapStore = defineStore('gmap', {

    state: (): State => ({
        map: null,
        ready: false,
        center: { lat: 35.24385944989924, lng: 137.09019885128768 },
        zoom: 10,
        bounds: { north: undefined, south: undefined, east: undefined, west: undefined },
        latLngBounds: undefined,
        zoomBounds: undefined,

        mapMode: 'edit',
        mapLock: null,

        streetView: {
            panorama: undefined,
            position: { lat: 35.24385944989924, lng: 137.09019885128768 },
            pov: {
                heading: 34,
                pitch: 10,
            },
            zoom: 0,
        },

        guideMarkers: [],
        infoMarker: undefined,


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

        setZoomBoundingBox(bb: google.maps.LatLngBounds) {
            this.zoomBounds = bb
        },

        setZoom(zoom: number) {
            this.map?.setZoom(zoom)
        },

        moveStreetView(position: google.maps.LatLng | google.maps.LatLngLiteral, pov?: google.maps.StreetViewPov) {
            this.streetView.panorama?.setPosition(position)
            if (pov) {
                this.streetView.panorama?.setPov(pov)
            }
        },

        moveStreetViewByPoint(rpt: RoutePoint, distance: number = 50) {
            const brmStore = useBrmRouteStore()
            const viewPoint = brmStore.getLocationByDistance(rpt.routeDistance - distance)
            const heading = google.maps.geometry.spherical.computeHeading(viewPoint, rpt)

            this.moveStreetView(viewPoint, { heading, pitch: 0 })
        },

        // ルートポイントを中心に前後にポイントを配置
        setGuideMarkers(rpt: RoutePoint) {
            const brmStore = useBrmRouteStore()
            const zeroDistance = rpt.routeDistance
            this.guideMarkers.length = 0
            for (let i = -20; i <= 20; i++) {
                const distance = zeroDistance + 0.1 * i * i * i
                const pt = brmStore.getLocationByDistance(distance)
                if (!pt.isMirror) {
                    const _marker = {
                        position: pt,
                        key: Symbol(),
                    }
                    this.guideMarkers.push(_marker)
                    // ガイドマーカーの中心を設定（Infowindow を置く）
                    if (i === 0) this.infoMarker = { marker: _marker, routePoint: rpt }
                }
            }
        },

        pack() {
            return {
                mapCenter: this.center,
                mapZoom: this.zoom,
                streetView: {
                    position: this.streetView.position,
                    zoom: this.streetView.zoom,
                    pov: this.streetView.pov
                }
            }
        },

        unpack(obj: any) {
            console.log('unpack', obj)
            this.center = obj.mapCenter
            this.zoom = obj.mapZoom
            this.streetView = { ...this.streetView, ...obj.streetView }
        }

    }
})
