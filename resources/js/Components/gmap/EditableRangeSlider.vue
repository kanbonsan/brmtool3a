<template>
    <el-slider v-model="editable" range :min="0" :max="editableMax" @input="resetTimeout"></el-slider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'

const props = defineProps(['resetTimeout'])

const routeStore = useBrmRouteStore()
// 編集範囲スライダー
const editableMax = computed(() => Math.max(routeStore.count - 1, 1))

const editable = computed({
    get(): any { return routeStore.editableIndex },

    set(val: [number, number]) {
        routeStore.setEditRange(val)
    }
})

</script>