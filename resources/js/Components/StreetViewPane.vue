<template>
    <div ref="panorama" class="panorama">
        STREETVIEW
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useGmapStore } from '@/stores/GmapStore'
import { map } from 'lodash'

const gmapStore = useGmapStore()
const panorama = ref()

watch(() => gmapStore.ready, (ready) => {

    if (!ready) return
    init()
})

onMounted(() => { if (gmapStore.ready) init() })

const init = () => {
    const panoramaObj = new google.maps.StreetViewPanorama(panorama.value, {

        position: gmapStore.streetView.position,
        pov: gmapStore.streetView.pov,
        zoom: gmapStore.streetView.zoom,

        disableDefaultUI: true,
        fullscreenControl: true,
        linksControl: true,
        panControl: true,
        showRoadLabels: true,
    })
    gmapStore.map?.setStreetView(panoramaObj)
    gmapStore.streetView.panorama = panoramaObj

    const Marker = new google.maps.Marker({
        position: gmapStore.streetView.position,
        map: gmapStore.streetView.panorama,
        opacity: 0.5
    })

    console.log()

}

</script>

<style scoped>
.panorama {
    width: 100%;
    height: 100%;
}
</style>