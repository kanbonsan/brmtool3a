import { defineStore } from 'pinia'
import type {  CuePoint } from '@/classes/cuePoint'
import type { RoutePoint } from '@/classes/routePoint'


type State = {
    cuePoints: CuePoint[],
}

type addCuePointArg = RoutePoint | { lat:number, lng:number }

export const useBrmRouteStore = defineStore('brmroute', {

    state: (): State => ({
        cuePoints: [],
    }),

    getters: {
        
    },

    actions: {
        

        
        addCuePoint: (arg: addCuePointArg)=>{
            
            
        }
    }
})
