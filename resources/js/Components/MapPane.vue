<template>
    <GoogleMap ref="gmap" :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="15"
        v-slot="slotProps">
        <Marker :options="markerOption(pt)" v-for="(pt) in availablePoints" :key="pt.id" @click="markerClick(pt.id)">
        </Marker>
        <BrmPolyline :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" />
        <CustomPopup :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" v-slot="{ update }"
            :activate="popupActivate">
            <TestDiv :update="update"></TestDiv>
        </CustomPopup>
    </GoogleMap>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, createApp, Component } from "vue"
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

import TestDiv from "@/Components/TestDiv.vue"


const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 })

const store = useBrmRouteStore()
const gmapStore = useGmapStore()
const messageStore = useMessage()

const availablePoints = computed(() => store.availablePoints)

const popupActivate = ref(null)

const gmap = ref<InstanceType<typeof GoogleMap> | null>(null)
onMounted(() => {
    setTimeout(() => {
        store.deviate()
        store.setExclude(10, 50)
        store.setExclude(300, 350)
        console.log('deviated')
    }, 5000)
    setTimeout(() => {
        store.delete(100, 200)
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
        store.setPoints(brm.encodedPathAlt)

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
    const pt = store.getPointById(id)
    pt.opacity = 0.5
    const result = await popup(id)
}

const popup = async (id: symbol) => {

    popupActivate.value = {
        active: true,
        markerId: id
    }

    return (await result())
}



</script>