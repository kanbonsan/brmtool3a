<script setup lang="ts">

import { ref,watch } from "vue"
import { Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useCuesheetStore } from "@/stores/CueSheetStore"
import { computed, inject } from "vue"
import { googleMapsKey } from "./gmap/keys"
import { CuePoint } from "@/classes/cuePoint"
import { markerIcon }from "@/lib/gmapcueicon"

import type { RoutePoint } from "@/classes/routePoint"

const routeStore = useBrmRouteStore()
const cuesheetStore = useCuesheetStore()

const props = defineProps(["visible"])
const cuePoints = computed(() => cuesheetStore.getArray)
const refRoutePoint = ref<RoutePoint|null>()

let timer: number | null = null

const popups = inject(googleMapsKey)

const marker = ref()

const getOption = (cpt: CuePoint) => {
    return {
        position: { lat: cpt.lat, lng: cpt.lng },
        opacity: 1.0,
        draggable: true,
        visible: props.visible,
        icon: {url: markerIcon()}
    }
}

watch(refRoutePoint, (currentPt, prevPt)=>{
    if( currentPt){
        currentPt.opacity = 0.8
    }
    if(prevPt){
        prevPt.opacity = 0.0
    }
})

const onClick = async (cpt: CuePoint, $event: google.maps.MapMouseEvent) => {

    if (timer !== null) { return }

    timer = setTimeout(async () => {
        const response: any = await cueMarkerPopup(cpt, 'CuePointMenu')
        timer = null
        console.log(response)
    }, 250)

}

/**
 * ダブルクリックでキューポイントを参照点に戻す
 */
const onDblClick = (cpt: CuePoint, index: number, $event: google.maps.MapMouseEvent) => {

    clearTimeout(timer!)
    timer = null

    const routePoint = routeStore.getPointById(cpt.routePointId)
    if (routePoint === undefined) return

    const markerObj = marker.value[index]
    markerObj.marker.setPosition(routePoint)
    cpt.setPosition(new google.maps.LatLng(routePoint))

}

const onDrag = (cpt: CuePoint, $event: google.maps.MapMouseEvent) => {
    refRoutePoint.value = routeStore.getClosePoint($event.latLng!)
}

const onDragEnd = async (cpt: CuePoint, $event: google.maps.MapMouseEvent) => {
    cpt.setPosition($event.latLng!)
    refRoutePoint.value = routeStore.getClosePoint($event.latLng!)
    const routePoint = refRoutePoint.value

    if(routePoint !== null && routeStore.hasCuePoint(routePoint)===null){
        console.log('移動可能')
        popups!.menuParams.value = { cpt }
        const result = await cueMarkerPopup(cpt, 'CuePointReattachMenu')
        console.log(result)
        routePoint.opacity = 0.0
    }

}

const cueMarkerPopup = async (cpt: CuePoint, menu:string) => {

    if (popups?.popupParams.value.activated) {
        return Promise.reject('n/a')
    }

    popups!.menuComp.value = menu

    popups!.menuParams.value = { cuePoint: cpt }

    const position = new google.maps.LatLng({ ...cpt })
    const result = await popups!.popup(position!)

    return result

}

</script>

<template>
    <Marker ref="marker" v-for="(cpt, index) in cuePoints" :key="cpt.id" :options="getOption(cpt)"
        @click="onClick(cpt, $event)" @drag="onDrag(cpt, $event)" @dragend="onDragEnd(cpt, $event)"
        @dblclick="onDblClick(cpt, index, $event)">
    </Marker>
</template>