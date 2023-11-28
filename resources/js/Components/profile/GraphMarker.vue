<template>
    <canvas ref="marker" :width="width" :height="height">
    </canvas>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useProfileStore } from "@/stores/ProfileStore"
import { useMouseInElement } from '@vueuse/core'

const props = defineProps<
    { width: number, height: number }>()

const profileStore = useProfileStore()
const marker = ref<HTMLCanvasElement>()
const { elementX, elementY, isOutside } = useMouseInElement(marker)

const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, props.width, props.height)
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.strokeText(`X:${elementX.value} Y:${elementY.value}`, 100, 100)
}



onMounted(() => {
    const ctx = marker.value?.getContext('2d')
    if (!ctx) return
    draw(ctx)

    watch([elementX, elementY], () => draw(ctx))
})

</script>
