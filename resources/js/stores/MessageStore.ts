import { defineStore } from 'pinia'

type State = {
    footer: string
}

export const useMessage = defineStore('message',{

    state: (): State =>({
        footer: ""
    }),

    getters: {

        footerMessage:(state)=>state.footer
    },

    actions:{

        setFooterMessage(message:string){
            this.footer = `${message}`
        }
    }

})