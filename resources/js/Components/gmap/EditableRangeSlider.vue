<template>
    <el-row :gutter="20">
        <el-col :span="20">
            <el-slider style="width: 100%;" v-model="editable" range :min="0" :max="editableMax"
                @input="resetTimeout"></el-slider>
        </el-col>
        <el-col :span="4">
            <el-tooltip content="全範囲を編集範囲にします" placement="right">
                <el-button style="width:100%" type="primary" plain @click="onResetRange">解除</el-button>
            </el-tooltip>
        </el-col>
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

const onResetRange = () => {
    props.resetTimeout()
    editable.value = [0, routeStore.count - 1]
}

</script>