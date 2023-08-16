<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>ポイント移動</span>

                <el-icon :size="24">
                    <circle-close></circle-close>
                </el-icon>
            </div>
        </template>
        <el-row>キューポイントをこの地点に移動しますか?</el-row>
        <el-row>
            <el-button size="small">はい</el-button><el-button size="small">いいえ</el-button>
        </el-row>

    </el-card>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onClick = () => {
    props.submit('Test Div 1')
}

</script>

<style scoped>
.cue-point {
    width: 120px;
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
