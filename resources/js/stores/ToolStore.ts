// アプリ全般の設定を管理する

import { defineStore } from 'pinia'

type BrmInfo = {
    id: number | undefined
    organization: string,
    clubCode: string,
    brmDate: Date | undefined,
    startTime: Date[],
    brmDistance: number | undefined,
    title?: string,
    description?: string
}

type State = {
    brmInfo: BrmInfo,
    currentBrmStart: Date | undefined
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
        currentBrmStart: undefined
    }),

    getters: {
        
    },

    actions: {
        
    }
})
