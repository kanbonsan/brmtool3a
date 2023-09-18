<template>
    <div ref="panorama" class="panorama">
        STREETVIEW
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useGmapStore } from '@/stores/GmapStore'

const gmapStore = useGmapStore()
const panorama = ref()
const pano = ref<google.maps.StreetViewPanorama>()

watch(() => gmapStore.ready, (ready) => {

    pano.value = new google.maps.StreetViewPanorama(panorama.value, {
        position: gmapStore.center,
        pov: {
            heading: 34,
            pitch: 10,
        },
        zoom: 0,
    })
    gmapStore.map?.setStreetView(pano.value)
})

</script>

<style scoped>
.panorama {
    width: 100%;
    height: 100%;
}
</style>