<template>
    <canvas ref="graph" :width="width" :height="height">
    </canvas>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeMount, watch } from 'vue'
import { useProfileStore } from "@/stores/ProfileStore"

const props = defineProps<
    { width: number, height: number }>()

const profileStore = useProfileStore()

const draw = (ctx: CanvasRenderingContext2D) => {
    const data = profileStore.profile
    const width = data.length
    const { xOrig, yOrig } = profileStore.graphOrigin

    if (width === 0) return

    // グラフ稜線(ridge)のパス
    const ridge = new Path2D()
    ridge.moveTo(xOrig!, Math.max(profileStore.getY(data[0].mean), 0))
    for (let i = 1; i < width; i++) {
        ridge.lineTo(xOrig! + i, Math.max(profileStore.getY(data[i].mean), 0))
    }
    // グラフ塗りつぶしのパス
    const graphFill = new Path2D(ridge)
    graphFill.lineTo(xOrig! + width - 1, yOrig!)
    graphFill.lineTo(xOrig!, yOrig!)
    graphFill.closePath()
    ctx.save()
    ctx.fillStyle = 'pink'
    ctx.fill(graphFill)
    ctx.restore()
    ctx.save()
    ctx.strokeStyle = "brown"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.stroke(ridge)
    ctx.restore()






}


const graph = ref<HTMLCanvasElement>()
onMounted(() => {
    const ctx = graph.value?.getContext('2d')
    if (!ctx) return
    draw(ctx)
})

</script>
