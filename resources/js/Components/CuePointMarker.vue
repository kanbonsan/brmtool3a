<script setup lang="ts">

import { Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useCuesheetStore } from "@/stores/CueSheetStore"
import { computed, inject } from "vue"
import { RoutePoint } from "@/classes/routePoint"
import { CuePoint } from "@/classes/cuePoint"

const routeStore = useBrmRouteStore()
const cuesheetStore = useCuesheetStore()

const props = defineProps(["visible"])
const cuePoints = computed(()=>cuesheetStore.getArray)

const getOption = (cpt: CuePoint) => {
    console.log('getOption')
    return {
        position: { lat: cpt.lat, lng: cpt.lng },
        opacity: 1.0,
        draggable: true,
        visible: props.visible
    }
}

const onClick = (cpt: CuePoint, $event: google.maps.MapMouseEvent) => {
    console.log('cue point clicked')
}

const onDragEnd = (cpt: CuePoint, $event: google.maps.MapMouseEvent) =>{
    cpt.setPosition( $event.latLng!)
}

</script>

<template>
    <Marker v-for="cpt in cuePoints" :key="cpt.id" :options="getOption(cpt)" @click="onClick(cpt, $event)" @dragend="onDragEnd(cpt, $event)">

    </Marker>
</template>