<template>
    <el-slider v-model="subpathRange" range :min="editableIndex[0]" :max="editableIndex[1]"></el-slider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBrmRouteStore } from '@/stores/BrmRouteStore';

const routeStore =useBrmRouteStore()
// 編集範囲スライダー
const editableIndex = computed(()=>routeStore.editableIndex)


const subpathRange = computed({
    get(): any { return routeStore.editableIndex },

    set(val: [number, number]) {
        routeStore.setSubpath(val)
    }
})

</script>