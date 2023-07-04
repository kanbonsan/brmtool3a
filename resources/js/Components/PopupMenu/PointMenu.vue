<template>
    <el-card class="ex-poly">
        <template #header>
            <h3>ポイントメニュー</h3>
        </template>
        
        解除しますか?
        <el-button class="ma1" bg-color="secondary" xs @click="onClick(true)">解除します</el-button>
        <el-button class="ma1" bg-color="secondary" xs @click="onClick(false)">キャンセル</el-button>

    </el-card>
</template>

<script setup lang="ts">

const props = defineProps(['submit'])

const onClick = (result: boolean) => {
    props.submit({ status: 'success', result })
}

</script>
