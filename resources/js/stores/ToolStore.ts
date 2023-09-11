// アプリ全般の設定を管理する

import { defineStore } from 'pinia'
import { useBrmRouteStore } from './BrmRouteStore'
import { useCuesheetStore } from './CueSheetStore'

type timestamp = number

type BrmInfo = {
    id: number | undefined
    organization: string,
    clubCode: string,
    brmDate: timestamp | undefined,
    startTime: timestamp[],
    brmDistance: number | undefined,
    title?: string,
    description?: string
}

type State = {
    brmInfo: BrmInfo,
    currentBrmStart: timestamp | undefined
}

export const useToolStore = defineStore('tool', {

    state: (): State => ({
        brmInfo: {
            id: undefined,
            organization: '',
            clubCode: '',
            brmDate: undefined,
            startTime: [],
            brmDistance: undefined,
            title: '',
            description: ''
        },
        currentBrmStart: undefined,
    }),

    getters: {

    },

    actions: {

        pack() {
            return { brmInfo: this.brmInfo, currentBrmStart: this.currentBrmStart }
        },

        unpack({ brmInfo, currentBrmStart }: { brmInfo: any, currentBrmStart: any }) {
            this.brmInfo = { ...this.brmInfo, ...brmInfo }
            this.currentBrmStart = currentBrmStart
        },

        save() {
            const routeStore = useBrmRouteStore()
            const cuesheetStore = useCuesheetStore()

            const data = {
                tool: this.pack(),
                route: routeStore.pack(),
                cuesheet: cuesheetStore.pack()
            }

            window.localStorage.setItem('brmtool3', JSON.stringify(data))
        },

        restore() {

            const routeStore = useBrmRouteStore()
            const cuesheetStore = useCuesheetStore()

            const data = window.localStorage.getItem('brmtool3')
            if (!data) {
                console.log('no backup')
                return false
            }
            const { tool, route, cuesheet } = JSON.parse(data)
            try {
                this.unpack(tool)
                routeStore.unpack(route)
                cuesheetStore.unpack(cuesheet)
                return true
            } catch (e) {
                console.log('ToolStore.restore() error', e)
                return false
            }


        },

        reset() {
            const routeStore = useBrmRouteStore()
            const cuesheetStore = useCuesheetStore()

            this.$reset()
            cuesheetStore.$reset()
            routeStore.$reset()
        }
    }
})
