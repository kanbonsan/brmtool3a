<template>
    <div class="testdiv">
        <p>これはテストのビューです。どうぞよろしくお願いいたします。非常に長くなってしまった場合は折り返しますか？</p>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick">Button</w-button>
    </div>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onClick = () => {
    props.submit('hello world')
}

</script>
