<template>
    <div ref="panorama" class="panorama">
    </div>
    <SvMarker v-for="marker in guideMarkers" :key=marker.key :position="marker.position"/>
    <SvInfowindow />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useGmapStore } from '@/stores/GmapStore'
import SvMarker from '@/Components/SvMarker.vue'
import SvInfowindow from '@/Components/SvInfowindow.vue'

const gmapStore = useGmapStore()
const panorama = ref()

const guideMarkers = computed(() => gmapStore.guideMarkers)

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

    panoramaObj.addListener('position_changed', () => {
        gmapStore.streetView.position = panoramaObj.getPosition()
    })
    panoramaObj.addListener('pov_changed', () => {
        gmapStore.streetView.pov = panoramaObj.getPov()
    })
    panoramaObj.addListener('zoom_changed', () => {
        gmapStore.streetView.zoom = panoramaObj.getZoom()
    })
}

</script>

<style scoped>
.panorama {
    width: 100%;
    height: 100%;
}
</style>