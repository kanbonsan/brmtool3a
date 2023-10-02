<template>
    <canvas ref="axis" :width="width" :height="height">
    </canvas>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProfileStore } from "@/stores/ProfileStore"

const profileStore = useProfileStore()

const width = computed(() => profileStore.width)
const height = computed(() => profileStore.height)

</script>