<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject, ref } from "vue"
import { googleMapsKey } from "./gmap/keys";

const store = useBrmRouteStore()
const props = defineProps(["visible"])
const subpaths = computed(() => store.subpathRanges)

const subpathEditMode = computed(()=>store.subpathEdit)

const mid = ref([])
const hasPre = subpaths.hasOwnProperty('pre')
const hasPost = subpaths.hasOwnProperty('post')

const headPoint = ref(subpaths.middle.points[0])
const tailPoint = ref(subpaths.middle.points[subpaths.middle.points.length-1])

const getOption = (subpath) => {

    return {
        strokeColor: "blue",
        strokeWidth: 2,
        path: subpath.points,
        visible: props.visible,
        zIndex: 3,
        editable: subpath.editable
    }
}

const getEditPathOption = ( subpath, editable=false ) =>{
    return {
        strokeColor: "blue",
        strokeWidth: 2,
        path: subpath.points,
        visible: props.visible,
        zIndex: 3,
        editable: true
    }
}

const updateSubpathEdit = ()=>{
    store.setSubpathEditPoints( middle.value[1].polyline.getPath().getArray())
    console.log( middle.value[1].polyline.getPath())
}

const googleMaps = inject(googleMapsKey)
const { popup, menuComp, popupParams, menuParams } = inject(googleMapsKey)

</script>

<template>
    <template v-if="!subpathEditMode">
        <Polyline v-for="sp in subpaths" :key="sp.id" :options="getOption(sp)"/>
    </template>
    <template v-else>
        <Polyline :options="getEditPathOption(subpaths.middle)" @mouseup="updateSubpathEdit"/>
    </template>
</template>