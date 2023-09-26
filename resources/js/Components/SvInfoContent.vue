<template>
    <div v-if="cuePoint">
        Hello, {{ cuePoint?.properties.name }}
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CuePoint } from '@/classes/cuePoint'
const props = defineProps<{
    cuePoint: CuePoint | undefined
}>()
const label = computed(()=>{
    
})

</script>


<style scoped></style>