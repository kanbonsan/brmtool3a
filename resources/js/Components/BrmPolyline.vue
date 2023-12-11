
<script setup>
import ExcludedPolyline from "./ExcludedPolyline.vue"
import EditablePolyline from "./EditablePolyline.vue";
import SubpathPolyline from "./SubpathPolyline.vue";

const props = defineProps(["api", "map", "ready", "visible"])

</script>

<template>
    <EditablePolyline :visible="visible" :ready="ready"/>
    <ExcludedPolyline :visible="visible"/>
    <SubpathPolyline :visible="visible" :map="map"/>
</template>
