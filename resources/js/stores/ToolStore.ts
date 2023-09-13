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
    description?: string,
    pcGroupOpen?: 'head'|'individual'|'tail',    // グループPCのオープンをどこに合わせるか
    pcGroupClose?: 'head'|'individual'|'tail',
}

type Properties = {
    clubCode: number,
    pcGroupOpen: 'head'|'individual'|'tail',    // グループPCのオープンをどこに合わせるか
    pcGroupClose: 'head'|'individual'|'tail',
    
}

type State = {
    brmInfo: BrmInfo,
    currentBrmStart: timestamp | undefined,
    properties: Properties
}

/*
アプリ設定項目
    ブルベ設定
        主催クラブコード
　PC
　　グループPCのオープン・クローズの設定

*/

export const useToolStore = defineStore('tool', {

    state: (): State => ({
        brmInfo: {
            id: undefined,
            organization: '',
            clubCode: '',
            brmDate: undefined,
            startTime: [],
            brmDistance: undefined,
            description: '',
            pcGroupOpen: undefined,
            pcGroupClose: undefined
        },
        currentBrmStart: undefined,
        properties:{
            clubCode: 600008,
            pcGroupOpen: 'individual',
            pcGroupClose: 'individual'
        }
    }),

    getters: {

    },

    actions: {

        pack() {
            return { brmInfo: this.brmInfo, currentBrmStart: this.currentBrmStart, properties: this.properties }
        },

        unpack({ brmInfo, currentBrmStart, properties }: { brmInfo: any, currentBrmStart: any, properties:any }) {
            this.brmInfo = { ...this.brmInfo, ...brmInfo }
            this.currentBrmStart = currentBrmStart
            this.properties = { ...this.properties, ...properties}
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
