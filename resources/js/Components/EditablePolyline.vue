<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useGmapStore } from "@/stores/GmapStore"
import { computed, watch } from "vue"
import _ from "lodash"

const props = defineProps(["visible"])

const store = useBrmRouteStore()
const gmapStore = useGmapStore()

const editMode = computed(() => gmapStore.editMode || gmapStore.subpathSelectMode)

const editableRanges = computed(() => store.editableRanges)

watch(() => store.editableIndex, _.debounce(() => {
    if (!window.google) return
    const editable = editableRanges.value.find(r => r.editable === true)
    const bb = new google.maps.LatLngBounds
    for (const pt of editable.points) {
        bb.extend({ lat: pt.lat, lng: pt.lng })
    }
    gmapStore.setZoomBoundingBox(bb)
}, 500))

const getOption = (range) => {
    return {
        strokeColor: "red",
        strokeOpacity: range.editable && editMode.value ? 1.0 : 0.3,
        strokeWidth: 2,
        path: range.points,
        visible: props.visible,
        zIndex: 1
    }
}

</script>

<template>
    <Polyline v-for="range in editableRanges" :key="range.id" :options="getOption(range)">

    </Polyline>
</template>