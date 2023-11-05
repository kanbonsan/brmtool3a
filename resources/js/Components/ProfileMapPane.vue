<template>
    <div ref="profile" class="profile" style="position:relative;">
        <Graph style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Graph>
        <Axis style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Axis>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed, watchEffect } from 'vue'
import { useProfileStore } from '@/stores/ProfileStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useElementBounding, useMouseInElement } from '@vueuse/core'


import Axis from '@/Components/profile/Axis.vue'
import Graph from './profile/Graph.vue'
//import GraphConsole from './profile/GraphConsole.vue'

const profileStore = useProfileStore()
const brmStore = useBrmRouteStore()

const profile = ref()
const redrawKey = ref<symbol>()

const { width, height } = useElementBounding(profile)
const { x, y, isOutside } = useMouseInElement(profile)

watch([width, height], ([width, height]) => {
    profileStore.width = width
    profileStore.height = height
    redrawKey.value = Symbol()
}, { immediate: true })

onMounted(() => {
    setTimeout(()=>{
    profileStore.$patch((state) => {
        state.distance.end = brmStore.brmDistance
        state.altitude.high = brmStore.brmHighestAltitude

    })
    redrawKey.value = Symbol()
},2000)

    watchEffect(() => {
        console.log('watchEffect')

        //redrawKey.value = Symbol()
    },
        { flush: 'post' })


    // watch(() => brmStore.brmDistance, async (brmDistance) => {
    //     profileStore.setDistance({ end: brmDistance })
    // }
    // )

    // watch(() => brmStore.brmHighestAltitude, async (altitude) => {
    //     profileStore.$patch((state) => state.altitude.high = altitude)
    // })

    // watch([() => profileStore.distance, () => profileStore.altitude], ([dist, alt]) => {
    //     console.log(dist,alt)
    //     redrawKey.value = Symbol()
    // })
})

</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>