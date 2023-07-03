<template>
    <el-card
     class="ex-poly">
     <template #header>
        ポイントメニュー
     </template>
        <p>除外区域</p>
        解除しますか?
        <w-button class="ma1" bg-color="secondary" xs @click="onClick(true)">解除します</w-button>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick(false)">キャンセル</w-button>

    </el-card>
</template>

<script setup lang="ts">

const props = defineProps(['submit'])

const onClick = (result: boolean) => {
    props.submit({status:'success', result})
}

</script>
