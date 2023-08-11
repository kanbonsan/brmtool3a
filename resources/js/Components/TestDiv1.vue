<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>Card name</span>
                <el-button class="button" text>Operation button</el-button>
            </div>
        </template>

    </el-card>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onClick = () => {
    props.submit('Test Div 1')
}

</script>

<style scoped>
:deep(.el-card__header){
    padding: 0px;
}

.cue-point {
    width: 400px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
</style>
