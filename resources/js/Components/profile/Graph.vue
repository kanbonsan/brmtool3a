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
    ctx.save()
    ctx.strokeStyle="brown"
    for (let i = 0; i < width; i++) {
        ctx.beginPath()
        ctx.moveTo(xOrig! + i, yOrig!)
        ctx.lineTo(xOrig! + i, Math.max(profileStore.getY(data[i].mean),0))
        ctx.stroke()
    }
    ctx.restore()
}


const graph = ref<HTMLCanvasElement>()
onMounted(() => {
    console.log('graph mounted')
    const ctx = graph.value?.getContext('2d')
    //draw(ctx!)
})

</script>
