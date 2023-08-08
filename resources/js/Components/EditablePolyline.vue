<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useToolStore } from "@/stores/ToolStore";
import { computed, inject } from "vue"
import { googleMapsKey } from "./gmap/keys";

const props = defineProps(["visible"])

const store = useBrmRouteStore()
const toolStore = useToolStore()
const editMode = computed(()=>toolStore.editMode || toolStore.subpathSelectMode)

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