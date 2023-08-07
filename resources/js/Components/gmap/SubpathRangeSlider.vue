<template>
    <el-row>
        編集範囲の中でサブパスの範囲を設定します
    </el-row>
    <el-slider v-model="subpathRange" range :min="editableIndex[0]" :max="editableIndex[1]"
        @input="onSliderInput"></el-slider>
    <el-row justify="end">
        <el-button @click="submitFunc('subpathRange:submit')">決定</el-button>
        <el-button @click="submitFunc('ReturnToEdit')">キャンセル</el-button></el-row>
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

const onSliderInput = ()=>{
    routeStore
    props.resetTimeout()
}
</script>