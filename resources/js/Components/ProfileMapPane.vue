<template>
    <div ref="profile" class="profile">
        <Axis />
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

const init = ()=>{
    if( !profileStore.distance.end) {
        profileStore.distance.end = 
    }
}

</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>