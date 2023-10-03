<template>
    <canvas ref="axis" :width="width" :height="height">
    </canvas>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount, watch } from 'vue'
import { useProfileStore } from "@/stores/ProfileStore"

const props = defineProps<
    { width: number, height: number }>()

const profileStore = useProfileStore()

const axis = ref<HTMLCanvasElement>()

const draw = (ctx: CanvasRenderingContext2D) => {

    const { x, y } = profileStore.graphOrigin
    const { width, height } = profileStore.graphSize
    const { begin, end } = profileStore.distance
    const { xAxis, yAxis}=profileStore.graphScale

    if (!x || !y || !width || !height || !end) return
    
    
    ctx.save()

    ctx.beginPath()
    ctx.moveTo(x, y - height)
    ctx.lineTo(x,y)
    ctx.lineTo(x+width,y)
    ctx.stroke()
    ctx.restore()

    // X軸目盛り
    

}

onMounted(() => {
    const ctx = axis.value?.getContext('2d')
    draw(ctx!)
})
</script>