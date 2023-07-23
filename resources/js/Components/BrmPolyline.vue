
<script setup>
import ExcludedPolyline from "./ExcludedPolyline.vue"
import EditablePolyline from "./EditablePolyline.vue";

const props = defineProps(["api", "map", "ready", "visible"])

</script>

<template>
    <EditablePolyline :visible="visible"/>
    <ExcludedPolyline :visible="visible"/>
</template>
