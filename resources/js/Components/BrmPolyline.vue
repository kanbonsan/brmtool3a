
<script setup>
import ExcludedPolyline from "./ExcludedPolyline.vue"
import EditablePolyline from "./EditablePolyline.vue";

const props = defineProps(["api", "map", "ready"])

</script>

<template>
    <EditablePolyline />
    <ExcludedPolyline />
</template>
