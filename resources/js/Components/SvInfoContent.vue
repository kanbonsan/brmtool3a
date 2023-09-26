<template>
    <div v-if="cuePoint">
        <p style="text-transform: none;">{{ label }}</p>
         <p>{{ name }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CuePoint } from '@/classes/cuePoint'
const props = defineProps<{
    cuePoint: CuePoint | undefined
}>()
const label = computed(()=>{
    const cpt = props.cuePoint
    if(!cpt)return
    let _label = ''
    switch(cpt.type){
        case 'pc':
            _label=`PC ${cpt.controlLabel}`
            break
        case 'pass':
            _label =`CHK ${cpt.controlLabel}`
            break
        case 'cue':
            _label =`No ${cpt.pointNo}`
    }
    return _label
})
const name = computed(()=>props.cuePoint?.cuesheetName)

</script>


<style scoped></style>