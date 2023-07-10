<template>
    <GoogleMap ref="gmap" :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="15"
        v-slot="slotProps">
        <Marker :options="markerOption(pt)" v-for="(pt) in availablePoints" :key="pt.id" @click="markerClick(pt)"
            @mouseover="markerMouseover(pt)" @mouseout="markerMouseout(pt)">
        </Marker>
        <BrmPolyline :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" />
        <CustomPopup :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" v-slot="{ submit }"
            :params="popupParams">
            <component :is="menus[menuComp]?.component" :submit="submit" :params="menuParams"></component>
        </CustomPopup>
        <Marker :options="test" @drag="onTestDrag" @dragend="onTestDragEnd"></Marker>
        <CuePointMarker :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready"/>
    </GoogleMap>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, provide, type Ref } from "vue"
import type { Component } from 'vue'
import WaveUI from 'wave-ui'

import { GoogleMap, Marker, Polyline } from "vue3-google-map"
import brm from "../../sample/sample200.brm.json"

import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useCuesheetStore } from "@/stores/CueSheetStore"
import { useGmapStore } from "@/stores/GmapStore"
import { useMessage } from "@/stores/MessageStore"
import circle from '../../images/pointCircle.png'

import BrmPolyline from "@/Components/BrmPolyline.vue"
import { RoutePoint } from "@/classes/routePoint"

import CustomPopup from "@/Components/CustomPopup.vue"
import { debounce } from "lodash"
// ポップアップメニュー
import TestDiv1 from "@/Components/TestDiv1.vue"
import TestDiv2 from "@/Components/TestDiv2.vue"
import ExcludePolyMenu from "@/Components/PopupMenu/ExcludedPolylineMenu.vue"
import PointMenu from "@/Components/PopupMenu/PointMenu.vue"

import { useDimension } from "@/Composables/dimension"
import CuePointMarker from "./CuePointMarker.vue"
import axios from "axios"
const { panes } = useDimension()


interface menuComponentOptions {
    offsetX?: number
    offsetY?: number
    width?: number
    height?: number
    timeout?: number | undefined    // nullable で auto close しない
}

interface menuComponent {
    component: Component
    options?: menuComponentOptions
}

type Activator = RoutePoint

type Menus = {
    [key: string]: menuComponent
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
    Menu1: { component: TestDiv1 },
    Menu2: {
        component: TestDiv2,
        options: { timeout: 3000 }
    },
    ExcludePoly: {
        component: ExcludePolyMenu,
        options: { timeout: 3000 }
    },
    PointMenu: {
        component: PointMenu,
        options: { timeout: 50000, offsetY: -10 }
    }
}

const menuParams = ref<any>({})

const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 })

const routeStore = useBrmRouteStore()
const gmapStore = useGmapStore()
const messageStore = useMessage()
const cuesheetStore =useCuesheetStore()

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
onMounted(() => {
    setTimeout(() => {
        routeStore.deviate()
        routeStore.setExclude(10, 50)
        routeStore.setExclude(300, 350)
        routeStore.setEditableTest()
        console.log('deviated')
    }, 5000)
    setTimeout(() => {
        routeStore.delete(100, 200)
        console.log('delete')
    }, 10000)

})

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
            const res = await axios.get("/api/getAlt", { params: {lat:ev.latLng?.lat(),lng:ev.latLng?.lng()}})
            console.log(res.data)
        })
    }
)


const test = ref({
    position: { lat: 35.23943409063303, lng: 137.11307650527957 },
    draggable: true,
})

const cl = ref<RoutePoint | null>(null)

const onTestDrag = (ev: google.maps.MapMouseEvent) => {
    const closest = routeStore.getClosePoint(ev.latLng!)
    if (closest !== null) {
        if (cl.value !== closest && cl.value !== null) {
            cl.value.opacity = 0.0
        }
        closest.opacity = 1.0
        cl.value = closest
    } else {
        if (cl.value !== null) {
            cl.value.opacity = 0.0
        }
        cl.value = null
    }
}

const onTestDragEnd = async (ev: google.maps.MapMouseEvent) => {
    if (cl.value === null) return

    const result = await markerDragPopup()

    setTimeout(() => {
            if(cl.value === null)return
            cl.value.opacity! = 0.0
    }, 1000)



}

const markerDragPopup = async () => {
    return
    if (popupParams.value.activated) {
        return Promise.reject('n/a')
    }
}



const markerOption = (pt: RoutePoint) => {
    return {
        position: pt,
        opacity: pt.opacity,
        icon: { url: circle, anchor: new google.maps.Point(8, 8) }
    }
}



const markerClick = async (pt: RoutePoint) => {

    pt.opacity = 0.5

    const response: any = await markerPopup(pt)
    pt.opacity = 0.0

    if( response.status == 'success'){
        if( response.result === 'addCuePoint'){
            console.log('add cue point')
            cuesheetStore.addCuePoint(pt)
        }
    }
    console.log(response)

    
}

const markerMouseover = (pt: RoutePoint) => {
    if (popupParams.value.activator === pt) {
        return
    }

    if (!pt.editable) return

    pt.opacity = 0.8

    console.log('markerMouseover')
}

const markerMouseout = (pt: RoutePoint) => {
    if (popupParams.value.activator === pt) {
        return
    }

    if (!pt.editable) return

    pt.opacity = 0.0

    console.log('markerMouseout')
}

const markerPopup = async (pt: RoutePoint) => {

    if (popupParams.value.activated) {
        return Promise.reject('n/a')
    }
    menuComp.value = 'PointMenu'


    menuParams.value = { ts: Date.now(), cuePoint: cuesheetStore.routePoints.includes(pt) }

    const position = new google.maps.LatLng(pt)
    const result = await popup(position, pt)

    return result

}

const popup = async (position: google.maps.LatLng, activator?: Activator) => {

    /**
     * Promiseオブジェクトの resolve 関数を取り出して子コンポーネントに渡して
     * そちらで解決する。
     * 長らく悩んでいた問題が解決！！ 
     * 「VueでもユーザーのタイミングでPromiseをresolve()できへんか？」
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

provide('popup', { popup, menuComp, popupParams, menuParams })
</script>