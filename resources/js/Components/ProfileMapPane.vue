<template>
    <div ref="profile" class="profile" @wheel="onMousemove">
        <canvas :width="width" :height="height">
        </canvas>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useProfileStore } from '@/stores/ProfileStore'
import { useElementBounding } from '@vueuse/core';

const profileStore = useProfileStore()

const profile = ref()
const { width,height } = useElementBounding(profile)

const onMousemove = (ev: MouseEvent) => console.log('moving', ev)


</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>