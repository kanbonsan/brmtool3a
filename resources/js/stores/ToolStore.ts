// アプリ全般の設定を管理する

import { defineStore } from 'pinia'

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
        serialize(){
            return JSON.stringify({ brmInfo: this.brmInfo, currentBrmStart: this.currentBrmStart})
        },

        unserialize(json: string){
            const { brmInfo, currentBrmStart} = JSON.parse(json)
            this.brmInfo = {...brmInfo}
            this.currentBrmStart = currentBrmStart
        }
    }
})
