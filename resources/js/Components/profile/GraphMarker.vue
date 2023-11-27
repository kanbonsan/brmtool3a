<template>
    <canvas ref="marker" :width="width" :height="height">
    </canvas>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount, watch } from 'vue'
import { useProfileStore } from "@/stores/ProfileStore"

const props = defineProps<
    { width: number, height: number }>()

const profileStore = useProfileStore()

const draw = (ctx: CanvasRenderingContext2D) => {
    
}


const graph = ref<HTMLCanvasElement>()
onMounted(() => {
    const ctx = graph.value?.getContext('2d')
    if (!ctx) return
    draw(ctx)
})

</script>
