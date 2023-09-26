<template>
    <div v-if="hasSlotContent" class="iw-wrapper">
        <div ref="iw" v-bind="$attrs">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">

import {
    useSlots,
    ref,
    computed,
    onBeforeUnmount,
    Comment,
    onMounted,
} from "vue"
import { useGmapStore } from "@/stores/GmapStore";
import { type GuideMarker } from '@/stores/GmapStore'

const slots = useSlots()
const props = defineProps<{
    marker: GuideMarker | undefined
}>()
const gmapStore = useGmapStore()
const panorama = computed(()=>gmapStore.streetView.panorama)

const hasSlotContent = computed(() => slots.default?.().some((vnode) => vnode.type !== Comment))    // ?. オプショナルチェーン
const infoWindow = ref<google.maps.InfoWindow>()
const iw = ref<HTMLElement>()

const close = ()=>infoWindow.value?.close()

onMounted(()=>{
    infoWindow.value = new google.maps.InfoWindow()
    infoWindow.value.setPosition( props.marker!.position)
    infoWindow.value.setContent(hasSlotContent.value ? iw.value : '')
    infoWindow.value.open(panorama.value)
})

onBeforeUnmount(()=>{
    if(infoWindow.value){
        close()
    }
})
</script>

<style scoped>
.iw-wrapper {
    display: none;
    text-transform: none;
}
</style>