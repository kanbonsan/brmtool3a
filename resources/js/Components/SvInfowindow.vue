<template>
    <slot />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { CuePoint } from '@/classes/cuePoint'
import { type GuideMarker } from '@/stores/GmapStore'
const props = defineProps<{
    cuePoint: { point: CuePoint, id: symbol },
    marker: GuideMarker
}>()
const iw = ref<google.maps.InfoWindow>()

onMounted(() => {
    iw.value = new google.maps.InfoWindow()
    iw.value.setPosition()

    console.log('info mounted')
})

onUnmounted(() => {
    iw.value?.close()
}
</script>