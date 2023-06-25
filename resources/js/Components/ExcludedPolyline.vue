<script setup>
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore";
import {computed, inject} from "vue"

const store=useBrmRouteStore()

const excludes = computed(()=>store.excludedRanges)

const getOption=(ex)=>{
    return {
        strokeColor: "black",
        strokeWidth: 2,
        path: ex.points,
    }
}

const {popup,menuComp,popupOptions} = inject('popup')

const onClick = async (id,ev)=>{
    const target = excludes.value.find((ex)=>ex.id===id)
    store.restoreExclude(target.begin, target.end)
    console.log(ev)
    menuComp.value = 'Menu1'

    const result = await popup(ev.latLng)

    console.log(result)
}

</script>

<template>
    <Polyline v-for="ex in excludes" :key="ex.id" :options="getOption(ex)" @click="onClick(ex.id, $event)">

    </Polyline>
</template>