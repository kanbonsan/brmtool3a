import { defineStore } from 'pinia'
import { type CuePoint } from '@/classes/cuePoint'


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
        addCuePoint:()=>{
            
        }
    }
})
