<template>
    <div v-if="hasSlotContent" class="iw-wrapper">
        <div ref="iw" v-bind="$attrs">
            <slot />
        </div>
    </div>
</template>

<script setup lang="ts">

import {
    useSlots,
    watch,
    ref,
    computed,
    onBeforeUnmount,
    Comment,
    onMounted,
} from "vue"

const slots = useSlots()
const hasSlotContent = computed(() => slots.default?.().some((vnode) => vnode.type !== Comment))    // ?. オプショナルチェーン
const infoWindow = ref<google.maps.InfoWindow>()
const iw = ref<HTMLElement>()

const open = (opts?:google.maps.InfoWindowOpenOptions)=>infoWindow.value?.open({...opts})
const close = ()=>infoWindow.value?.close()

onBeforeUnmount(()=>{
    if(infoWindow.value){
        close()
    }
})
</script>

<style scoped>
.iw-wrapper {
    display: none;
}

.mapdiv .iw-wrapper {
    display: inline-block;
}
</style>