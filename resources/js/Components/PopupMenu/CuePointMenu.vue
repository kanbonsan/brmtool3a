<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>Card name</span>

                <el-icon :size="24">
                    <circle-close @click="onCancelClose"></circle-close>
                </el-icon>

            </div>
        </template>

    </el-card>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onClick = (result: boolean) => {
    props.submit({ status: 'success', result })
}

const onCancelClose = ()=>{
    props.submit({ status: 'success', result:'cancel' })
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
