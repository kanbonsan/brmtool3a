// アプリ全般の設定を管理する

import { defineStore } from 'pinia'
import { useBrmRouteStore } from './BrmRouteStore'
import { useCuesheetStore } from './CueSheetStore'
import { useGmapStore } from './GmapStore'

type timestamp = number

type BrmInfo = {
    id: number | undefined
    organization: string,
    clubCode: string | undefined,
    brmDate: timestamp | undefined,
    startTime: timestamp[],
    currentStartTime: timestamp | undefined,
    brmDistance: number | undefined,
    description?: string,   // v3.0 で新設
    // 以下 v3.0 で新設
    pcGroupOpen?: 'head' | 'individual' | 'tail',    // グループPCのオープンをどこに合わせるか
    pcGroupClose?: 'head' | 'individual' | 'tail',
}

// 保存用ファイル
type FileInfo = {
    brmFileName: string | undefined
}

// アプリの設定
type Properties = {
    clubCode: string,
    pcGroupOpen: 'head' | 'individual' | 'tail',    // グループPCのオープンをどこに合わせるか
    pcGroupClose: 'head' | 'individual' | 'tail',
    startPcClose: number                        // スタートの閉鎖タイム（日本では 30分）
}

type Panes = {
    [pane: string]: number
}

type State = {
    brmInfo: BrmInfo,
    fileInfo: FileInfo,
    properties: Properties,
    panes: Panes
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
            id: Date.now(), // 初期化時に決定
            organization: '',
            clubCode: undefined,
            brmDate: undefined,
            startTime: [],
            currentStartTime: undefined,
            brmDistance: undefined,
            description: '',
            pcGroupOpen: undefined,
            pcGroupClose: undefined
        },
        fileInfo: {
            brmFileName: undefined
        },
        properties: {
            clubCode: "600008",
            pcGroupOpen: 'individual',
            pcGroupClose: 'individual',
            startPcClose: 30,
        },
        panes: {
            vertical: 50,
            left: 50,
            right: 50
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
                const hh = d.getHours()
                const day = Math.floor((ts - startDateTs) / (24 * 3600_000))
                const date = new Date(startDateTs + day * 24 * 3600_000)

                const dd = (day === 0) ? '' : (state.brmInfo.brmDate ? `${date.getDate()}日/` : `+${day}日/`)

                return { ts, label: `${dd}${hh}:` + `${mm}00`.slice(-2) }
            })
        }
    },

    actions: {

        pack() {
            return { brmInfo: this.brmInfo, fileInfo: this.fileInfo, properties: this.properties, panes: this.panes }
        },

        unpack({ brmInfo, fileInfo, properties, panes }: { brmInfo: any, fileInfo: any, properties: any, panes: any }) {
            this.brmInfo = { ...this.brmInfo, ...brmInfo }
            this.fileInfo = { ...this.fileInfo, ...fileInfo }
            this.properties = { ...this.properties, ...properties }
            this.panes = { ...this.panes, ...panes }
        },

        // brmfile 保存用データ 兼 localstorage 保存用データ
        // brmfileを用意するときはここから内容を抜粋する

        snapshot() {
            const routeStore = useBrmRouteStore()
            const cuesheetStore = useCuesheetStore()
            const gmapStore = useGmapStore()

            return {
                tool: this.pack(),
                route: routeStore.pack(),
                cuesheet: cuesheetStore.pack(),
                gmap: gmapStore.pack()
            }
        },

        save() {
            const data = this.snapshot()
            window.localStorage.setItem('brmtool3', JSON.stringify(data))
        },

        restore() {

            const routeStore = useBrmRouteStore()
            const cuesheetStore = useCuesheetStore()
            const gmapStore = useGmapStore()

            const data = window.localStorage.getItem('brmtool3')
            if (!data) {
                console.log('no backup')
                return false
            }
            const { tool, route, cuesheet, gmap } = JSON.parse(data)

            try {
                this.unpack(tool)
                routeStore.unpack(route)
                cuesheetStore.unpack(cuesheet)
                gmapStore.unpack(gmap)
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
        },


        // 外部取り込みのデータを内部形式に変換
        // .gpx ファイル と .brm (.brz) ファイルに対応。
        // .brm ファイルは ver 3.0 用のみ受け入れ. 各バージョンからのコンバートは API に任せる.
        brmDataUpload(data: any) {
            const routeStore = useBrmRouteStore()
            const cuesheetStore = useCuesheetStore()
            const gmapStore = useGmapStore()

            if (data.type === 'track') { // GPX ファイル読み込み時
                const tracks: Array<{ lat: number, lng: number, alt: number }> = data.track.map((pt: { lat: string, lng: string, alt: string }) => ({ lat: parseFloat(pt.lat), lng: parseFloat(pt.lng), alt: parseFloat(pt.alt) }))
                const route = routeStore.makePackData(tracks)
                routeStore.$reset()
                cuesheetStore.$reset()
                routeStore.unpack(route)
                gmapStore.moveStreetViewByPoint(routeStore.points[0], 50)
            } else if (data.type === 'brm') {
                console.log(data)
                
                const { tool, route, cuesheet } = data.brmData
                console.log(cuesheet)
                this.reset()
                this.unpack(tool)
                routeStore.unpack(route)
                setTimeout(() => cuesheetStore.unpack(cuesheet), 1000)
            }
            return data
        },

        // brmfile に保存用のスナップショットを作成する
        // brmfile のバージョンは 3.0 とし、2.0 との互換性は持たせない（BRMTOOL2 では読み込めない仕様）
        // バージョン 2.0 は読み込めるようにする
        // バージョン 1 は API で 2.0 に変換して読み込みする
        makeBrmData() {

            const ss = this.snapshot()

            const tool = { brmInfo: ss.tool.brmInfo }
            const route = { ...ss.route }
            const cuesheet = { ...ss.cuesheet }

            return {
                app: 'brmtool',
                version: '3.0',
                data: { tool, route, cuesheet }
            }
        }
    }
})
