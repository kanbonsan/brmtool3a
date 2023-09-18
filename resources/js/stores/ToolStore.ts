// アプリ全般の設定を管理する

import { defineStore } from 'pinia'
import { useBrmRouteStore } from './BrmRouteStore'
import { useCuesheetStore } from './CueSheetStore'

type timestamp = number

type BrmInfo = {
    id: number | undefined
    organization: string,
    clubCode: string | undefined,
    brmDate: timestamp | undefined,
    startTime: timestamp[],
    brmDistance: number | undefined,
    title?: string,
    description?: string,
    pcGroupOpen?: 'head' | 'individual' | 'tail',    // グループPCのオープンをどこに合わせるか
    pcGroupClose?: 'head' | 'individual' | 'tail',
}

type Properties = {
    clubCode: string,
    pcGroupOpen: 'head' | 'individual' | 'tail',    // グループPCのオープンをどこに合わせるか
    pcGroupClose: 'head' | 'individual' | 'tail',
    startPcClose: number                        // スタートの閉鎖タイム（日本では 30分）

}

type State = {
    brmInfo: BrmInfo,
    properties: Properties,
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
            clubCode: undefined,
            brmDate: undefined,
            startTime: [],
            brmDistance: undefined,
            description: '',
            pcGroupOpen: undefined,
            pcGroupClose: undefined
        },
        properties: {
            clubCode: "600008",
            pcGroupOpen: 'individual',
            pcGroupClose: 'individual',
            startPcClose: 30,
        }
    }),

    getters: {
        startList(state) {
            const list = [...state.brmInfo.startTime]
            const startDateTs = state.brmInfo.brmDate || new Date(0).setHours(0, 0, 0)
            if (list.length === 0) return []

            list.sort((a, b) => a - b)

            return list.map(ts => {
                const d = new Date(ts)
                const mm = d.getMinutes()
                const hh = ts - startDateTs >= 24 * 3600_000 ? d.getHours()+24 : d.getHours()
                
                return { ts, label: `${hh}:` + `${mm}00`.slice(-2)}
            })
        }
    },

    actions: {

        pack() {
            return { brmInfo: this.brmInfo, properties: this.properties }
        },

        unpack({ brmInfo, currentBrmStart, properties }: { brmInfo: any, currentBrmStart: any, properties: any }) {
            this.brmInfo = { ...this.brmInfo, ...brmInfo }
            this.properties = { ...this.properties, ...properties }
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
