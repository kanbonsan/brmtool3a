<template>
    <canvas ref="marker" :width="width" :height="height" @click="onClick">
    </canvas>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useProfileStore } from "@/stores/ProfileStore"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useMouseInElement } from '@vueuse/core'

const props = defineProps<
    { width: number, height: number }>()

const profileStore = useProfileStore()
const routeStore = useBrmRouteStore()

const marker = ref<HTMLCanvasElement>()
const { elementX, elementY, isOutside } = useMouseInElement(marker)

const lineCoords = computed(() => {
    const range = profileStore.graphSize.range
    return (_x: number) => {
        const x = Math.floor(_x)
        const profile = profileStore.profile
        const alt = profile[x].mean
        const y = Math.floor(profileStore.graphSize.range.se.y - alt * profileStore.graphResolution.y!) + 0.5

        return ({ x: x + range.nw.x + 0.5, y, alt: Math.floor(alt) })
    }
})

const draw = (ctx: CanvasRenderingContext2D, x?: number) => {
    const range = profileStore.graphSize.range

    ctx.clearRect(0, 0, props.width, props.height)
    // 対象がないときは消すだけ
    if (!x) return
    const coords = lineCoords.value(x)
    ctx.save()
    ctx.strokeStyle = "black"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(range.nw.x, coords.y)
    ctx.lineTo(range.se.x, coords.y)
    ctx.moveTo(coords.x, range.se.y)
    ctx.lineTo(coords.x, range.nw.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(coords.x, coords.y, 4, 0, 2 * Math.PI)
    ctx.fill()
    ctx.restore()

}

const onClick = (ev: MouseEvent) => {
    const x = ev.offsetX
    const y = ev.offsetY
    const r = profileStore.graphSize.range
    if (x < r.nw.x || x > r.se.x || y < r.nw.y || y > r.se.y) {
        //
    } else {
        console.log('inside')
    }
}

onMounted(() => {
    const ctx = marker.value?.getContext('2d')
    if (!ctx) return
    draw(ctx)

    watch([elementX, elementY, () => profileStore.routePoint], ([x, y, pt]) => {
        const range = profileStore.graphSize.range
        routeStore.setProfileMapMarkerDistance(undefined)
        if (isOutside && (pt !== undefined) && pt.brmDistance > profileStore.distance.begin && pt.brmDistance < profileStore.distance.end!) {    // && isOutside を入れないと、profileMap にマウスが入っても pt がリセットされないことがあった.
            draw(ctx, (pt.brmDistance - profileStore.distance.begin) * profileStore.graphResolution.x!)
        } else if (range.nw.x <= x && x <= range.se.x && range.nw.y <= y && y <= range.se.y) {
            routeStore.setProfileMapMarkerDistance((x - range.nw.x) / profileStore.graphResolution.x! + profileStore.distance.begin)
            draw(ctx, x - range.nw.x)
        } else {
            // 引き出し線を消すために引数無しで呼ぶ
            draw(ctx)
        }
    })

})

</script>
