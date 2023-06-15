<template>
    <div class="testdiv">
        <p>これはテストのビューです。どうぞよろしくお願いいたします。非常に長くなってしまった場合は折り返しますか？</p>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick">Button</w-button>
    </div>
</template>

<script setup lang="ts">


import { ref, onMounted, onUnmounted} from 'vue'

const props = defineProps(['update'])

const onClick = () => {
    console.log('onClick')
    props.update('hello world')
}

onMounted(()=>{console.log('testdiv mounted')})
onUnmounted(()=>{console.log('testdiv unmounted')})

</script>
