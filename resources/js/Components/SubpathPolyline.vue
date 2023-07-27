<script setup lang="ts">
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject, ref } from "vue"

const store = useBrmRouteStore()
const props = defineProps(["visible"])
const subpaths = computed(() => store.subpathRanges)

const subpathEditMode = computed(()=>store.subpathEdit)

const prePath = ref()

const getOption = (subpath, arg:number) => {

    return {
        strokeColor: arg===1 ?"blue": "darkgray",
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
    <template v-if="!subpathEditMode">
        <Polyline v-for="sp in subpaths" :key="sp.id" :options="getOption(sp, 1)">

        </Polyline>
    </template>
    <template v-else>
        <Polyline v-for="sp in subpaths" :key="sp.id" :options="getOption(sp, 2)">

        </Polyline>
    </template>
</template>