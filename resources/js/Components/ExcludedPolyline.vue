<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject } from "vue"
import { googleMapsKey } from "./gmap/keys";

const store = useBrmRouteStore()
const props = defineProps(["visible"])
const excludes = computed(() => store.excludedRanges)

const getOption = (ex) => {
    return {
        strokeColor: "black",
        strokeWidth: 2,
        path: ex.points,
        visible: props.visible,
        zIndex: 2
    }
}

const { popup, menuComp, popupParams, menuParams } = inject(googleMapsKey)

const onClick = async (id, ev) => {

    if (popupParams.value.activated === true) {
        return
    }

    const target = excludes.value.find((ex) => ex.id === id)
    menuComp.value = 'ExcludePoly'

    const res = await popup(ev.latLng)
    if( res.status === 'success' && res.result === true){
        store.restoreExclude(target.begin, target.end)
    }
}

</script>

<template>
    <Polyline v-for="ex in excludes" :key="ex.id" :options="getOption(ex)" @click="onClick(ex.id, $event)"/>
</template>