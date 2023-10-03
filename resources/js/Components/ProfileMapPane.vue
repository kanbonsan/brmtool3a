<template>
    <div ref="profile" class="profile" style="position:relative;">
        <GraphConsole />
        <Axis :key="redrawKey" :width="width" :height="height"></Axis>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useProfileStore } from '@/stores/ProfileStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useElementBounding } from '@vueuse/core'

import Axis from '@/Components/profile/Axis.vue'
import GraphConsole from './profile/GraphConsole.vue'

const profileStore = useProfileStore()
const brmStore = useBrmRouteStore()

const profile = ref()
const redrawKey = ref<symbol>()

const { width, height } = useElementBounding(profile)

watch([width, height], ([width, height]) => {
    profileStore.width = width
    profileStore.height = height
    redrawKey.value = Symbol()
}, { immediate: true })

onMounted(() => {
    watch(() => brmStore.brmDistance, (brmDistance) => {
        profileStore.distance.end = brmDistance
    })

    watch(() => brmStore.brmHighestAltitude, (altitude) => {
        profileStore.altitude.high = altitude
    })

    watch([() => profileStore.distance, () => profileStore.altitude], (dist, alt) => {
        redrawKey.value = Symbol()
    }) 
})

</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>