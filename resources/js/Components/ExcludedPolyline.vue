<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore";
import {computed, setBlockTracking} from "vue"

const store=useBrmRouteStore()

const excludes = computed(()=>store.excludedRanges)

const getOption=(ex)=>{
    return {
        strokeColor: "black",
        strokeWidth: 2,
        path: ex.points,
    }
}

const onClick = (id)=>{
    const target = excludes.value.find((ex)=>ex.id===id)
    store.restoreExclude(target.begin, target.end)
}

</script>

<template>
    <Polyline v-for="ex in excludes" :key="ex.id" :options="getOption(ex)" @click="onClick(ex.id)">

    </Polyline>
</template>