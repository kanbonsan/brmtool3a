<template>
    <div class="testdiv">
        <p>TestDiv 2 {{ params.ts }}</p>
        <w-button class="ma1" bg-color="secondary" xs @click="onClick">Button</w-button>
    </div>
</template>

<script setup lang="ts">
import { onMounted , onUnmounted} from 'vue'
const props = defineProps(['submit', 'params'])

const onClick = () => {
    props.submit('Test Div 2')
}

onMounted(()=>console.log('test div 2 mounted'))
onUnmounted(()=>console.log('test div 2 unmounted'))

</script>
