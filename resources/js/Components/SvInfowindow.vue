<template>
    <slot />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref,computed } from 'vue'
import { CuePoint } from '@/classes/cuePoint'
import { type GuideMarker } from '@/stores/GmapStore'
import { useGmapStore } from '@/stores/GmapStore';

const props = defineProps<{
    cuePoint: CuePoint | undefined,
    marker: GuideMarker | undefined
}>()
const iw = ref<google.maps.InfoWindow>()
const gmapStore = useGmapStore()
const panorama = computed(()=>gmapStore.streetView.panorama)

onMounted(() => {
    iw.value = new google.maps.InfoWindow()
    iw.value.setPosition( props.marker!.position)
    iw.value.setContent(props.cuePoint?.properties.name)
    iw.value.open(panorama.value)
})

onUnmounted(() => {
    iw.value?.close()
})
</script>