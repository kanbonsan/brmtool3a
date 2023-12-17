<template>
    <Marker ref="profileMarker" :options="getOption()">
    </Marker>
</template>

<script setup lang="ts">

import { Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { watchImmediate } from "@vueuse/core"

const routeStore = useBrmRouteStore()
const getOption = (): any => {
    const distance = routeStore.profileMapMarkerDistance
    if (!distance) {
        return ({
            visible: false
        })
    }
    const point = routeStore.getCloseBrmPoint(distance)
    if (point) {
        return ({
            visible: true,
            position: { lat: point.lat, lng: point.lng },
            zIndex: 1,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: 'red',
                strokeColor: 'white',
                fillOpacity: 1,
                strokeWeight:2,
                strokeOpacity: 0.75,
                scale:5
            },
        })
    }
}


</script>