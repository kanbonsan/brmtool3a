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

    const { xOrig, yOrig } = profileStore.graphOrigin
    const { width, height } = profileStore.graphSize
    const { begin, end } = profileStore.distance
    const { low, high } = profileStore.altitude
    const { xAxis, yAxis } = profileStore.graphScale

    const xLabel = (dist: number) => xAxis! > 1000 ? `${Math.ceil(dist / 1000)}` : `${dist}`
    const yLabel = (alt: number) => yAxis! >= 1000 ? `${Math.ceil(alt / 1000)}k` : `${alt}`

    if (!xOrig || !yOrig || !width || !height || !end) return

    ctx.save()

    ctx.beginPath()
    ctx.moveTo(xOrig, yOrig - height)
    ctx.lineTo(xOrig, yOrig)
    ctx.lineTo(xOrig + width, yOrig)
    ctx.stroke()
    ctx.restore()

    // X軸目盛り
    const xScaleIndex = Math.ceil(begin / xAxis!)
    for (let i = xScaleIndex; ; i++) {
        const dist = xAxis! * i
        const x = profileStore.getX(dist)
        if (x > props.width) break
        ctx.beginPath()
        ctx.moveTo(x, yOrig!)
        ctx.lineTo(x, yOrig! + 5)
        ctx.stroke()
        // ラベル
        ctx.textAlign = 'center'
        ctx.strokeText(xLabel(dist), x, yOrig + 15)

    }
    // Y軸目盛り
    const yScaleIndex = Math.ceil(low / yAxis!)
    for (let i = yScaleIndex; ; i++) {
        const alt = yAxis! * i
        const y = profileStore.getY(alt)
        if (y < 0) break
        ctx.beginPath()
        ctx.moveTo(xOrig, y)
        ctx.lineTo(xOrig - 5, y)
        ctx.stroke()
        ctx.textAlign = 'end'
        ctx.strokeText(yLabel(alt), xOrig - 15, y)
    }

}

onMounted(() => {
    console.log('axis onmounted')
    const ctx = axis.value?.getContext('2d')
    //draw(ctx!)
})
</script>