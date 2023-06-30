<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject } from "vue"

const store = useBrmRouteStore()

const editableRanges = computed(() => store.editableRanges)



const getOption = (ex) => {
    return {
        strokeColor: "black",
        strokeWidth: 2,
        path: ex.points,
    }
}

</script>

<template>
    <template v-for="(range,key,index) in editableRanges">
        <Polyline v-if="range.available" :key="ex.id" :options="getOption(ex)" @click="onClick(ex.id, $event)">

        </Polyline>
    </template>
</template>