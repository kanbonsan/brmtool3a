<template>
    <div ref="profile" class="profile" style="position:relative;">
        <Graph style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Graph>
        <Axis style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Axis>
        <Console />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProfileStore } from '@/stores/ProfileStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useElementBounding, useMouseInElement } from '@vueuse/core'


import Axis from '@/Components/profile/Axis.vue'
import Graph from './profile/Graph.vue'
import Console from './profile/GraphConsole.vue'

const profileStore = useProfileStore()
const brmStore = useBrmRouteStore()

const profile = ref()
const redrawKey = ref(Symbol())

const { width, height } = useElementBounding(profile)
const { x, y, isOutside } = useMouseInElement(profile)

watch([width, height], ([width, height]) => {
    profileStore.width = width
    profileStore.height = height
    redrawKey.value = Symbol()
}, { immediate: true })

watch([()=>brmStore.brmDistance, ()=>brmStore.brmHighestAltitude],([distance,altitude])=>{
    profileStore.$patch((state)=>{
        state.distance.end = distance
        state.altitude.high = altitude
    })
    redrawKey.value=Symbol()
})

</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>