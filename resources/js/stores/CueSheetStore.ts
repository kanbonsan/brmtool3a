import { defineStore } from 'pinia'
import { CuePoint } from '@/classes/cuePoint'
import { RoutePoint } from '@/classes/routePoint'


type State = {
    cuePoints: CuePoint[],
}

export const useBrmRouteStore = defineStore('brmroute', {

    state: (): State => ({
        cuePoints: [],
    }),

    getters: {

    },

    actions: {

        addCuePoint: (arg: RoutePoint | { lat: number, lng: number }) => {
            if (arg instanceof RoutePoint) {
                const type ='cue'
                const routePointId = arg.id
            } else {    
                const type ='poi'
            }
            const {lat,lng} = arg
            const cuePoint = new CuePoint(lat,lng, type)
        }
    }
})
