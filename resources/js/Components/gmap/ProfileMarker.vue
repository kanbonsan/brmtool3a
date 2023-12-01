<template>
    <Marker ref="profileMarker" :options="getOption()">
    </Marker>
</template>

<script setup lang="ts">

import { ref, watch, computed } from "vue"
import { Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"

const routeStore = useBrmRouteStore()
const getOption = (): any=>{
    const distance = routeStore.profileMapMarkerDistance
    if(!distance){
        return ({
            visible: false
        })
    }
    const point = routeStore.getCloseBrmPoint(distance)
    if(point){
        return ({
            visible: true,
            position: {lat: point.lat, lng: point.lng},
            zIndex: 100
        })
    }
}


</script>