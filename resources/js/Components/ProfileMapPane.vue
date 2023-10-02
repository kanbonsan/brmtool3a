<template>
    <div ref="profile" class="profile">
        <Axis />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useProfileStore } from '@/stores/ProfileStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useElementBounding } from '@vueuse/core'

import Axis from '@/Components/profile/Axis.vue'

const profileStore = useProfileStore()
const brmStore = useBrmRouteStore()

const profile = ref()

const { width, height } = useElementBounding(profile)

watch([width, height], ([width, height]) => {
    profileStore.width = width
    profileStore.height = height
}, { immediate: true })

onMounted(()=>{
    watch( ()=>brmStore.brmDistance,  (brmDistance)=>{
        profileStore.distance.end = brmDistance
    })

    watch( ()=>brmStore.brmHighestAltitude,  (altitude)=>{
        profileStore.altitude.high = altitude
    })
})

</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>