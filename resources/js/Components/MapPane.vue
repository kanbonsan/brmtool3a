<template>
    <div style="position:relative;width:100%;height:100%;">
        <GoogleMap ref="gmap" :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="15"
            v-slot="slotProps">
            <Marker :options="markerOption(pt)" v-for="(pt) in availablePoints" :key="pt.id" @click="markerClick(pt)"
                @mouseover="markerMouseover(pt)" @mouseout="markerMouseout(pt)">
            </Marker>
            <BrmPolyline :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" :visible="mapObjectVisible" />
            <CustomPopup :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" v-slot="{ submit }"
                :params="popupParams">
                <component :is="menus[menuComp]?.component" :submit="submit" :params="menuParams"></component>
            </CustomPopup>
            <CuePointMarker :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready"
                :visible="mapObjectVisible" />
        </GoogleMap>

        <lower-drawer v-model="drawerActive" :title="drawers[drawerComp]?.title" :timeout="drawers[drawerComp]?.timeout"
            @timeout="drawers[drawerComp]?.timeoutFunc" @submit="onLowerDrawerSubmit" v-slot="{ reset, submit }">
            <component :is="drawers[drawerComp]?.component" :resetTimeout="reset" :submitFunc="submit"></component>
        </lower-drawer>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, provide, type Ref } from "vue"
import type { Component } from 'vue'

import { GoogleMap, Marker, Polyline } from "vue3-google-map"
import { googleMapsKey } from "@/Components/gmap/keys"
import brm from "../../sample/sample200.brm.json"

import { useToolStore } from "@/stores/ToolStore"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useCuesheetStore } from "@/stores/CueSheetStore"
import { useGmapStore } from "@/stores/GmapStore"
import { useMessage } from "@/stores/MessageStore"
import circle from '../../images/pointCircle.png'

import BrmPolyline from "@/Components/BrmPolyline.vue"
import { RoutePoint } from "@/classes/routePoint"

import CustomPopup from "@/Components/CustomPopup.vue"
import { debounce } from "lodash"

import LowerDrawer from "@/Components/gmap/LowerDrawer.vue"
import EditableRangeSlider from "./gmap/EditableRangeSlider.vue"
import SubpathRangeSlider from "./gmap/SubpathRangeSlider.vue"
import SubpathCommand from "./gmap/SubpathCommand.vue"
import SubpathEditConfirm from "./gmap/SubpathEditConfirm.vue"

// ポップアップメニュー
import ExcludePolyMenu from "@/Components/PopupMenu/ExcludedPolylineMenu.vue"
import PointMenu from "@/Components/PopupMenu/PointMenu.vue"

import { useDimension } from "@/Composables/dimension"
import CuePointMarker from "./CuePointMarker.vue"
import axios from "axios"
const { panes } = useDimension()


interface menuComponentOptions {
    /**
     * ポップアップ下中央の座標をずらすpx
     */
    offsetX?: number
    offsetY?: number
    width?: number
    height?: number
    /**
     * タイムアウト ms
     */
    timeout?: number | undefined    // nullable で auto close しない
}

interface menuComponent {
    component: Component
    options?: menuComponentOptions
}

interface drawerComponent {
    component: Component
    title?: string
    timeout: number,
    timeoutFunc?: () => void   // タイムアウト時の後処理
}

type Activator = RoutePoint

type Menus = {
    [key: string]: menuComponent
}

type Drawers = {
    [key: string]: drawerComponent
}

const defaultOptions: menuComponentOptions = {
    offsetX: 0,
    offsetY: 0,
    timeout: undefined
}
/**
 * CustomPopup 内に表示する slot の内容
 */
const menus: Menus = {
    ExcludePoly: {
        component: ExcludePolyMenu,
        options: { timeout: 3000 }
    },
    PointMenu: {
        component: PointMenu,
        options: { timeout: 50000, offsetY: 0 }
    }
}
/**
 * LowerDrawerメニューの内容
 */
const drawers: Drawers = {
    Editable: {
        component: EditableRangeSlider,
        title: "編集範囲",
        timeout: 15_000,
        timeoutFunc: () => {
            toolStore.setMode('edit')
        }
    },
    Subpath: {
        component: SubpathRangeSlider,
        title: "サブパス範囲設定",
        timeout: 15_000,
        timeoutFunc: () => {
            toolStore.setMode('edit')
            routeStore.resetSubpath()
        }
    },
    SubpathCommand: {
        component: SubpathCommand,
        title: "サブパスコマンド",
        timeout: 0,
        timeoutFunc: () => {   // タイムアウトにならない設定だがクローズボタンを押したときに呼んでもらって設定をリセットする
            toolStore.setMode('edit')
            routeStore.resetSubpath()
        }
    },
    SubpathEditConfirm: {
        component: SubpathEditConfirm,
        title: "サブパス編集",
        timeout: 0,
        timeoutFunc: () => {
            toolStore.setMode('edit')
            routeStore.resetSubpath()
        }
    }
}

const menuParams = ref<any>({})

//マップ上の表示を一時消去するタイマー（重複処理用）
let mapObjectVisibleTimer: number | null = null
const mapObjectVisible = ref<boolean>(true)

const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 })

const toolStore = useToolStore()
const routeStore = useBrmRouteStore()
const gmapStore = useGmapStore()
const messageStore = useMessage()
const cuesheetStore = useCuesheetStore()

const availablePoints = computed(() => routeStore.availablePoints)

const menuComp = ref<string>('')
const popupParams = ref<{
    activated?: boolean,
    activator?: RoutePoint, // popup の対象オブジェクト（eg メニュー表示中にマーカーを消さないように）
    position?: google.maps.LatLng,
    options?: menuComponentOptions,
    resolve?: (payload: any) => void
    reject?: (payload: any) => void
}>({ activated: false })

const gmap = ref<InstanceType<typeof GoogleMap> | null>(null)

watch(
    (): boolean | undefined => gmap.value?.ready,
    (ready) => {
        if (!ready || !gmap.value?.api || !gmap.value?.map) {
            return
        }

        /** Google Map インスタンス */
        const api = gmap.value.api
        const map = gmap.value.map

        gmapStore.map = map

        /** ルートの設定 */
        routeStore.setPoints(brm.encodedPathAlt)

        map.addListener(
            "bounds_changed",
            debounce(() => {
                const _bb = map.getBounds()
                const _sw = _bb?.getSouthWest()
                const _ne = _bb?.getNorthEast()
                gmapStore.bounds = {
                    north: _ne?.lat(),
                    south: _sw?.lat(),
                    east: _ne?.lng(),
                    west: _sw?.lng(),
                }
                gmapStore.latLngBounds = _bb
            }, 200)
        )

        map.addListener("zoom_changed",
            () => {
                gmapStore.zoom = map.getZoom()!
                messageStore.setFooterMessage(`zoom: ${map.getZoom()}`)
            })

        map.addListener("click", async (ev: google.maps.MapMouseEvent) => {
            console.log(`?lat=${ev.latLng?.lat()}&lng=${ev.latLng?.lng()}`)
            const res = await axios.get("/api/getAlt", { params: { lat: ev.latLng?.lat(), lng: ev.latLng?.lng() } })
            console.log(res.data)
        })

        // 地図上右クリックで画面上の polyline などを一時消去
        map.addListener("contextmenu", (ev: google.maps.MapMouseEvent) => {
            if (mapObjectVisibleTimer != null) {
                clearTimeout(mapObjectVisibleTimer)
            }
            mapObjectVisibleTimer = setTimeout(() => { mapObjectVisible.value = true }, 1500)
            mapObjectVisible.value = false
        })
    }
)

// Lower Drawer Menu
/**
 * Drawer 開閉のためのスイッチ
 * 0: false, >0 で true
 * boolean としないのは、表示の更新時に autoclose のタイマーをリセットするため
 */
const drawerActive = ref<number>(0)
/**
 * Drawer の表示内容
 */
const drawerComp = ref<string>('Editable')

const test = ref({
    position: { lat: 35.23943409063303, lng: 137.11307650527957 },
    draggable: true,
})

// ポイントマーカー

const markerOption = (pt: RoutePoint) => {
    return {
        position: pt,
        opacity: pt.opacity,
        icon: { url: circle, anchor: new google.maps.Point(8, 8) },
        visible: mapObjectVisible.value && pt.editable && !pt.excluded && !toolStore.subpathEditMode
    }
}

const markerClick = async (pt: RoutePoint) => {

    pt.opacity = 0.5

    // popup を開く。閉じられて　Promise が返るまで待機。
    const response: any = await markerPopup(pt)
    pt.opacity = 0.0

    if (response.status == 'success') {

        switch (response.result) {
            case 'addCuePoint':
                console.log('add cue point')
                cuesheetStore.addCuePoint(pt)
                break
            case 'editableRange':
                drawerComp.value = 'Editable'
                drawerActive.value += 1
                break
            case 'subpathBegin':
                toolStore.setMode('subpathSelect')
                routeStore.resetSubpath(pt) // サブパスインデックスの設定
                drawerComp.value = 'Subpath'
                drawerActive.value += 1
                break
            case 'subpathEnd':
                toolStore.setMode('subpath')
                drawerComp.value = 'SubpathCommand'
                drawerActive.value += 1

                routeStore.subpathSync()
                break
        }
    }

}

const markerMouseover = (pt: RoutePoint) => {

    const ptIndex = routeStore.getPointIndex(pt)

    if (popupParams.value.activator === pt) {
        return
    }

    if (!pt.editable) return

    if (toolStore.subpathSelectMode) {
        const _begin: number = Math.min(ptIndex, routeStore.subpathTemp.begin!)
        const _end: number = Math.max(ptIndex, routeStore.subpathTemp.end!)
        routeStore.setSubpath([_begin, _end])
    }

    pt.opacity = 0.8

}

const markerMouseout = (pt: RoutePoint) => {
    if (popupParams.value.activator === pt) {
        return
    }

    if (!pt.editable) return

    if (toolStore.subpathSelectMode) {

        routeStore.setSubpath([routeStore.subpathTemp.begin!, routeStore.subpathTemp.end!])
    }

    pt.opacity = 0.0

}

const markerPopup = async (pt: RoutePoint) => {

    if (popupParams.value.activated) {
        return Promise.reject('n/a')
    }
    menuComp.value = 'PointMenu'


    menuParams.value = { ts: Date.now(), cuePoint: cuesheetStore.routePoints.includes(pt), pt }

    const position = new google.maps.LatLng(pt)

    const result = await popup(position, pt)

    return result

}

const popup = async (position: google.maps.LatLng, activator?: Activator) => {

    /**
     * Promiseオブジェクトの resolve 関数を取り出して子コンポーネントに渡して
     * そちらで解決する。
     * 長らく悩んでいた問題が解決！！ 
     * 「VueでもユーザーのタイミングでPromiseをresolve()できへんか？」(Web page)
     */

    return new Promise((resolve, reject) => {

        const resolveFunc = (payload: any) => {
            popupParams.value.activated = false
            popupParams.value.activator = undefined
            resolve(payload)
        }

        popupParams.value = {
            activated: true,
            activator,
            resolve: resolveFunc,
            reject: reject,
            position: position,
            options: Object.assign({}, defaultOptions, menus[menuComp.value].options)
        }
    })

}

/**
 * 画面下のドロワー内 slot からの submit をキャッチ
 * @param payload 
 */
const onLowerDrawerSubmit = (payload: string) => {

    switch (payload) {
        // サブパスをキャンセル
        case 'ReturnToEdit':
            toolStore.setMode('edit')
            routeStore.resetSubpath()
            drawerActive.value = 0
            break
        case 'subpathRange:submit':
            toolStore.setMode('subpath')
            drawerComp.value = 'SubpathCommand'
            drawerActive.value += 1
            break
        case 'subpath:pathEdit':
            toolStore.setMode('subpathEdit')
            drawerComp.value = 'SubpathEditConfirm'
            drawerActive.value += 1
            break
        case 'subpath:editPathConfirm':
            routeStore.subpathReplace()
            routeStore.resetSubpath()
            toolStore.setMode('edit')
            drawerActive.value = 0
            break
        case 'subpath:delete':
            routeStore.subpathDelete()
            routeStore.resetSubpath()
            toolStore.setMode('edit')
            drawerActive.value = 0
            break
        case 'subpath:exclude':
            routeStore.subpathSetExclude()
            routeStore.resetSubpath()
            toolStore.setMode('edit')
            drawerActive.value = 0
            break

    }
}

provide(googleMapsKey, { popup, menuComp, popupParams, menuParams })

</script>