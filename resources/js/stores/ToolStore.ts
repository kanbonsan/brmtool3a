import { defineStore } from 'pinia'

type State = {
    mode: 'edit'|'subpath'
}

export const useGmapStore = defineStore('tool', {

    state: (): State => ({
        mode: 'edit',
    }),

    getters: {
        mode: (state)=>state.mode
    }
})
