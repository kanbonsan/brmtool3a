<template>
    <GoogleMap ref="gmap" :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="15"
        v-slot="slotProps">
        <Marker :options="markerOption(pt)" v-for="(pt) in availablePoints" :key="pt.id" @click="markerClick(pt.id)">
        </Marker>
        <BrmPolyline :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" />
        <CustomPopup :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" v-slot="{ submit }"
            :params="popupParams">

            <component :is="menus[menuComp]?.component" :submit="submit" :params="menuParams"></component>

        </CustomPopup>
    </GoogleMap>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, provide } from "vue"
import type { Component } from 'vue'
import WaveUI from 'wave-ui'

import { GoogleMap, Marker, Polyline } from "vue3-google-map"
import brm from "../../sample/sample200.brm.json"

import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useGmapStore } from "@/stores/GmapStore"
import { useMessage } from "@/stores/MessageStore"
import circle from '../../images/pointCircle.png'

import BrmPolyline from "@/Components/BrmPolyline.vue"
import { RoutePoint } from "@/classes/routePoint"

import CustomPopup from "@/Components/CustomPopup.vue"
import { debounce } from "lodash"

import TestDiv from "@/Components/TestDiv1.vue"
import TestDiv1 from "@/Components/TestDiv1.vue"
import TestDiv2 from "@/Components/TestDiv2.vue"

interface menuComponentOptions {
    offsetX?: number
    offsetY?: number
    width?: number
    height?: number
    timeout?: number
}

interface menuComponent {
    component: Component
    options?: menuComponentOptions
}

type Menus = {
    [key: string]: menuComponent
}

const defaultOptions: menuComponentOptions = {
    offsetX: 0,
    offsetY: 0,
    timeout: 60_000
}

const menus: Menus = {
    Menu1: { component: TestDiv1 },
    Menu2: {
        component: TestDiv2,
        options: { timeout: 3000 }
    }
}

const menuParams = ref<any>({})

const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 })

const routeStore = useBrmRouteStore()
const gmapStore = useGmapStore()
const messageStore = useMessage()

const availablePoints = computed(() => routeStore.availablePoints)

const menuComp = ref<string>('')
const popupParams = ref<{
    activated?: boolean,
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

        map.addListener("click", (ev: google.maps.MapMouseEvent) => {
            console.log(`${ev.latLng?.lat()}:${ev.latLng?.lng()}`)
        })
    }
)

const markerOption = (pt: RoutePoint) => {
    return {
        position: pt,
        opacity: pt.opacity,
        icon: circle
    }
}

const markerClick = async (id: symbol) => {
    const pt = routeStore.getPointById(id)
    pt.opacity = 0.5
    const result = await markerPopup(id)

    console.log('markerClick', result, popupParams.value)
}

const markerPopup = async (id: symbol) => {

    menuComp.value = 'Menu2'
    menuParams.value = { ts: Date.now() }

    const pt = routeStore.getPointById(id)
    const position = new google.maps.LatLng(pt)
    const result = await popup(position)

    return result

}

const popup = async (position: google.maps.LatLng) => {

    /**
     * Promiseオブジェクトの resolve 関数を取り出して子コンポーネントに渡して
     * そちらで解決する。
     * 長らく悩んでいた問題が解決！！ 
     * 「VueでもユーザーのタイミングでPromiseをresolve()できへんか？」
     */

    return new Promise((resolve, reject) => {

        const resolveFunc = (payload: any) => {
            popupParams.value.activated = false 
            resolve(payload)
        }

        popupParams.value = {
            activated: true,
            resolve: resolveFunc,
            reject: reject,
            position: position,
            options: Object.assign({}, defaultOptions, menus[menuComp.value].options)
        }
    })

}

provide('popup', { popup, menuComp, popupOptions: popupParams })
</script>