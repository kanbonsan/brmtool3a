import { defineStore } from 'pinia'
import { CuePoint } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'
import { useBrmRouteStore } from './BrmRouteStore'

type State = {
    cuePoints: Map<symbol, CuePoint>
}

export const useCuesheetStore = defineStore('cuesheet', {

    state: (): State => ({
        cuePoints: new Map(),
    }),

    getters: {
        getCuePointById(state) {
            return (id: symbol) => {
                this.cuePoints.get(id)
            }
        },

        getArray(state) {
            return Array.from(state.cuePoints, (cue) => cue[1])
        },

        getRoutePointById(state){
            return (routePointId:symbol)=>{
                
            }
        },

        routePoints(state){
            const brmStore = useBrmRouteStore()
            const arr: RoutePoint[] = []
            state.cuePoints.forEach(cpt=>{
                if(cpt.pointId!==null){
                    arr.push( brmStore.getPointById(cpt.pointId))
                }
            })
            return arr
        }

    },

    actions: {

        addCuePoint(arg: RoutePoint | { lat: number, lng: number }) {

            if (arg instanceof RoutePoint) {
                const pt = new CuePoint(arg.lat, arg.lng, 'cue', arg.id)
                this.cuePoints.set(pt.id, pt)
            } else {
                const pt = new CuePoint(arg.lat, arg.lng, 'poi', null)
                this.cuePoints.set(pt.id, pt)
            }

        },

        removeCuePoint(id: symbol) {
            this.cuePoints.delete(id)
        }
    }
}
)
