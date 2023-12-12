<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useGmapStore } from "@/stores/GmapStore"
import { computed, watch, onMounted, ref } from "vue"
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

onMounted(() => setTimeout(() => console.log(props.api), 1000))

const getOption = (range) => {

    const brmDistance = store.editableBrmDistance
    const repeatLap = gmapStore.polylineArrowRepeat
    
    const icons = [{
        icon: {
            path: 1,    // google.maps.SymbolPath.FORWARD_CLOSED_ARROW
            fillColor: 'red',
            fillOpacity: 1,
            strokeColor: 'darkred',
            strokeWeight: 1,
            scale: 3
        },
        repeat: `${repeatLap / brmDistance * 100000}%`,
        offset: '3%',
    }
    ]

    return {
        strokeColor: "red",
        strokeOpacity: range.editable && editMode.value ? 1.0 : 0.3,
        strokeWidth: 2,
        path: range.points,
        visible: props.visible,
        zIndex: 1,
        icons: range.editable ? icons : {}
    }
}

</script>

<template>
    <Polyline v-for="range in editableRanges" :key="range.id" :options="getOption(range)">

    </Polyline>
</template>