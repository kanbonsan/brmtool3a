<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>キューポイント #{{ cuePoint.pointNo }}</span>

                <el-icon :size="24">
                    <circle-close @click="onCancelClose"></circle-close>
                </el-icon>

            </div>
        </template>
        <el-form label-width="70px" size="small" :model="form" @input="synchronize">
            <el-form-item label="名称">
                <el-input v-model="form.name"></el-input>
            </el-form-item>
            <el-form-item label="進路">
                <el-input v-model="form.direction"></el-input>
            </el-form-item>
            <el-form-item label="道路">
                <el-input v-model="form.route"></el-input>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import {  ref,reactive, onMounted, computed } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'

const props = defineProps(['submit', 'menuParams'])
const cuesheetStore = useCuesheetStore()

const cuePoint = props.menuParams.cuePoint
const form = reactive({...props.menuParams.cuePoint.properties})

const onClick = (result: boolean) => {
    props.submit({ status: 'success', result })
}

const onCancelClose = () => {
    props.submit({ status: 'success', result: 'cancel' })
}
const synchronize = ()=>{
    cuesheetStore.synchronize(props.menuParams.cuePoint.id, form)
}

</script>

<style scoped>
.cue-point {
    width: 400px;
}

:deep(.el-card__header) {
    --el-card-padding: 5px;
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    font-weight: bold;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
