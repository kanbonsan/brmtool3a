<template>
    <el-slider v-model="subpathRange" range :min="editableIndex[0]" :max="editableIndex[1]" @input="resetTimeout"></el-slider>
    <el-button>submit</el-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBrmRouteStore } from '@/stores/BrmRouteStore';

const routeStore =useBrmRouteStore()
const props = defineProps(['resetTimeout'])

const editableIndex = computed(()=>routeStore.editableIndex)

const subpathRange = computed({
    get(): any { return routeStore.subpathIndex },

    set(val: [number, number]) {
        routeStore.setSubpath(val)
    }
})

</script>