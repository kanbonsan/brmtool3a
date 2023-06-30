<template>
    <w-card
     class="ex-poly" title="ポイントメニュー">
        <p>除外区域</p>
        解除しますか?
        <w-button class="ma1" bg-color="secondary" xs @click="onClick(true)">解除</w-button>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick(false)">キャンセル</w-button>

    </w-card>
</template>

<script setup lang="ts">
import { useBrmRouteStore } from '@/stores/BrmRouteStore';
const props = defineProps(['submit'])

const onClick = (result: boolean) => {
    props.submit({status:'success', result})
}

</script>
