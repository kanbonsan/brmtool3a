import {type RoutePoint}  from "./routePoint"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"

export class CuePoint {

    id: symbol
    position: 
    attachedPoint: RoutePoint | null

    constructor(){
        this.id = Symbol()
        this.attachedPoint = null
    }




}