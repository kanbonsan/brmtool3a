<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject, ref } from "vue"
import { googleMapsKey } from "./gmap/keys";

const store = useBrmRouteStore()
const props = defineProps(["visible"])
const subpaths = computed(() => store.subpathRanges)

const subpathEditMode = computed(()=>store.subpathEdit)

const prePath = ref()
const middle = ref([])

const getOption = (subpath, arg) => {

    return {
        strokeColor: arg===1 ?"blue": "darkgray",
        strokeWidth: 2,
        path: subpath.points,
        visible: props.visible,
        zIndex: 3,
        editable: subpath.editable
    }
}

const updateSubpath = ()=>{
    store.setSubpathEditPoints( middle.value[1].polyline.getPath().getArray())
    console.log( middle.value[1].polyline.getPath())
}

const googleMaps = inject(googleMapsKey)
const { popup, menuComp, popupParams, menuParams } = inject(googleMapsKey)

</script>

<template>
    <template v-if="!subpathEditMode">
        <Polyline v-for="sp in subpaths" :key="sp.id" :options="getOption(sp, 1)">

        </Polyline>
    </template>
    <template v-else>
        <Polyline ref='middle' v-for="sp in subpaths" :key="sp.id" :options="getOption(sp, 2)" @mouseup="updateSubpath">

        </Polyline>
    </template>
</template>