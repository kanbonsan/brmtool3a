<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>ポイント移動</span>

                <el-icon :size="24">
                    <circle-close @click="onCancel"></circle-close>
                </el-icon>
            </div>
        </template>
        <el-row style="margin-bottom:5px;">{{ messageText }}</el-row>
        <el-row justify="center">
            <el-button size="small" @click="onSubmit">はい</el-button><el-button size="small"
                @click="onCancel">いいえ</el-button>
        </el-row>

    </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
const props = defineProps(['submit', 'menuParams'])

const messageText = ref('')

onMounted(() => {
    messageText.value = props.menuParams.cuePoint.type === 'poi' ? "POIのポイントをこの地点のキューポイントにしますか?" : "キューポイントをこの地点に移動しますか?"
})

const onSubmit = () => {
    props.submit({ status: 'success', result: 'reattach' })
}

const onCancel = () => {
    props.submit({ status: 'success', result: 'cancel' })
}



</script>

<style scoped>
.cue-point {
    width: 150px;
}

:deep(.el-card__header) {
    --el-card-padding: 5px;
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    font-weight: bold;
}

:deep(.el-card__body) {
    --el-card-padding: 5px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
