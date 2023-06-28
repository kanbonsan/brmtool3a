<template>
    <div class="ex-poly">
        <p>除外区域</p>
        解除しますか?
        <w-button class="ma1" bg-color="secondary" xs @click="onClick(true)">解除</w-button>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick(false)">キャンセル</w-button>

    </div>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onClick = (result: boolean) => {
    props.submit({status:'success', result})
}

</script>
