<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>除外解除</span>

                <el-icon :size="24">
                    <circle-close @click="onCancel"></circle-close>
                </el-icon>
            </div>
        </template>
        <el-row style="margin-bottom:5px;">除外区間を解除します. よろしいですか?</el-row>
        <el-row justify="center">
            <el-button size="small" @click="onSubmit">はい</el-button>
            <el-button size="small" @click="onCancel">いいえ</el-button>
        </el-row>
    </el-card>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onSubmit = () => {
    props.submit({ status: 'success', result: true })
}

const onCancel = () => {
    props.submit({ status: 'success', result: 'false' })
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