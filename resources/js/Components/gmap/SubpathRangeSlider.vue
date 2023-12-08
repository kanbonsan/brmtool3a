<template>
    <el-row :gutter="20">
        <el-col :span="20">
            <el-slider v-model="subpathRange" range :min="editableIndex[0]" :max="editableIndex[1]"
                @input="onSliderInput"></el-slider>
        </el-col>
        <el-col :span="4">

            <el-button @click="submitFunc('subpathRange:submit')">決定</el-button>
        </el-col>
    </el-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'

const routeStore = useBrmRouteStore()
const props = defineProps(['resetTimeout', 'submitFunc'])

const editableIndex = computed(() => routeStore.editableIndex)

const subpathRange = computed({
    get(): any { return routeStore.subpathIndex },
    set(val: [number, number]) {
        routeStore.setSubpath(val)
    }
})

const onSliderInput = () => {
    routeStore
    props.resetTimeout()
}
</script>