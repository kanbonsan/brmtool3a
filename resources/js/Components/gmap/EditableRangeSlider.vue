<template>
    <el-row>
        編集範囲を限定します. 重なった部分が編集しやすくなります.
    </el-row>
    <el-slider v-model="editable" range :min="0" :max="editableMax" @input="resetTimeout"></el-slider>
    <el-row>
        <el-button @click="onResetRange">解除</el-button>
        <el-button>OK</el-button>
    </el-row>
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

const onResetRange = ()=>{
    props.resetTimeout()
    editable.value = [0, routeStore.count-1]
}

</script>