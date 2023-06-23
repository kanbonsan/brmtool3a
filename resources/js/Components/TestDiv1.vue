<template>
    <div class="testdiv">
        <p>TestDiv 1</p>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick">Button</w-button>
    </div>
</template>

<script setup lang="ts">
const props = defineProps(['submit'])

const onClick = () => {
    props.submit('Test Div 1')
}

</script>
