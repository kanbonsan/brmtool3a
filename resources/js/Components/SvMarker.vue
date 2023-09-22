<template>
    <slot />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted , ref} from 'vue'
import { useGmapStore } from '@/stores/GmapStore';

const props = defineProps<{
    position: google.maps.LatLng | google.maps.LatLngLiteral,
    icon?: google.maps.Icon
}>()

const gmapStore = useGmapStore()
const marker = ref<google.maps.Marker>()

onMounted(()=>{
    marker.value = new google.maps.Marker( { position: props.position!})
    marker.value.setIcon( {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'blue',
        fillOpacity: 0.75,
        scale: 10,
        strokeColor: 'white',
        strokeOpacity: 0,
        strokeWeight: 1
    })
    marker.value.setMap( gmapStore.streetView.panorama! )
})

onUnmounted(()=>{
    marker.value?.setMap(null)
})


</script>