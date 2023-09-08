<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useGmapStore } from "@/stores/GmapStore";
import { computed, inject } from "vue"

const props = defineProps(["visible"])

const store = useBrmRouteStore()
const gmapStore = useGmapStore()

const editMode = computed(()=>gmapStore.editMode || gmapStore.subpathSelectMode)

const editableRanges = computed(() => store.editableRanges)

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