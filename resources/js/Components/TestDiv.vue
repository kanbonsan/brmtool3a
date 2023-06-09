<template>
    <div class="testdiv">
        <p>これはテストのビューです。どうぞよろしくお願いいたします。非常に長くなってしまった場合は折り返しますか？</p>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick">Button</w-button>
    </div>
</template>

<script setup lang="ts">

import { ref, getCurrentInstance } from 'vue'

const emits = defineEmits(['testdiv'])



const event = new CustomEvent('menu',{bubbles:true, detail:{ message: 'hello'}})

const onClick = () => {
    console.log('onClick')
    emits('testdiv')
}

</script>
