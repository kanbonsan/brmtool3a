<template>
    <el-slider v-model="editable" range :min="0" :max="editableMax"></el-slider>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBrmRouteStore } from '@/stores/BrmRouteStore';

const routeStore =useBrmRouteStore()
// 編集範囲スライダー
const editableMax = computed(()=>Math.max(routeStore.count-1,1))

const editable = computed({
    get(): any { return routeStore.editableIndex },

    set(val: [number, number]) {
        routeStore.setEditRange(val)
    }
})

</script>