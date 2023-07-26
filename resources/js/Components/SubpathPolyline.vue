<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject } from "vue"

const store = useBrmRouteStore()
const props = defineProps(["visible"])
const subpaths = computed(() => store.subpathRanges)

const getOption = (subpath, index) => {

    return {
        strokeColor: "blue",
        strokeWidth: 2,
        path: subpath.points,
        visible: props.visible,
        zIndex: 3,
        editable: subpath.editable
    }
}

const { popup, menuComp, popupParams, menuParams } = inject('popup')

const onClick = async (id, ev) => {

    if (popupParams.value.activated === true) {
        return
    }

    const target = excludes.value.find((ex) => ex.id === id)
    menuComp.value = 'ExcludePoly'

    const res = await popup(ev.latLng)
    if (res.status === 'success' && res.result === true) {
        store.restoreExclude(target.begin, target.end)
    }
}

</script>

<template>
    <Polyline v-for="(sp, index) in subpaths" :key="sp.id" :options="getOption(sp, index)" @mouseup="()=>{console.log('dragend')}">

    </Polyline>
</template>