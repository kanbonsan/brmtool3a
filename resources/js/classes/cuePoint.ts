import { type RoutePoint } from "./routePoint"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"

type cueType = 'cue' | 'pc' | 'pass' | 'poi'

export class CuePoint {

    id: symbol
    type: cueType
    lat: number
    lng: number
    pointId: symbol | null

    constructor(lat: number, lng: number, type: cueType = 'poi', routePointId: symbol | null = null) {
        this.id = Symbol()
        this.type = type
        this.lat = lat
        this.lng = lng
        this.pointId = routePointId
    }
}