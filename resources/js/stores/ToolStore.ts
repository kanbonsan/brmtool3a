import { defineStore } from 'pinia'

type MapMode = 'edit' | 'subpath' | 'subpathSelect' | 'subpathEdit' | 'subpathDirection' | 'subpathDirectionConfirm'

type MapLock = null | 'cuePoint' | 'subpath'

type State = {
    mapMode: MapMode
    mapLock: MapLock
}

export const useToolStore = defineStore('tool', {

    state: (): State => ({
        mapMode: 'edit',
        mapLock: null
    }),

    getters: {
        mode: (state) => state.mapMode,
        lock: (state) => state.mapLock,

        editMode: (state) => state.mapMode === 'edit',
        subpathMode: (state) => state.mapMode === 'subpath',
        subpathSelectMode: (state) => state.mapMode === 'subpathSelect',
        subpathEditMode: (state)=>state.mapMode === 'subpathEdit',
        subpathDirectionMode: (state)=>state.mapMode === 'subpathDirection'

    },

    actions: {
        setMode(mode: MapMode) {
            this.mapMode = mode
        },

        setLock(lock: MapLock){
            this.mapLock = lock
        }
    }
})
