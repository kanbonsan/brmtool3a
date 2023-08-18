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
        <el-form label-width="70px" size="small" :model="form">
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
import { progressProps } from 'element-plus'
import { reactive, onMounted, computed } from 'vue'
const props = defineProps(['submit', 'menuParams'])

const cuePoint = props.menuParams.cuePoint
const cueProperties = cuePoint.properties

const form = reactive({
    name: '',
    direction: '',
    route: '',
})

onMounted(() => {
    console.log(props.menuParams.cuePoint)
    console.log(props.menuParams.cuePoint.properties)
    console.log(`menu open at ${props.menuParams.cuePoint.pointNo}`)
})

const onClick = (result: boolean) => {
    props.submit({ status: 'success', result })
}

const onCancelClose = () => {
    props.submit({ status: 'success', result: 'cancel' })
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
