<script setup>
import { Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import {useCuesheetStore}from "@/stores/CueSheetStore"
import { computed, inject } from "vue"

const routeStore = useBrmRouteStore()
const cuesheetStore = useCuesheetStore()

const cuePoints = cuesheetStore.getArray

const { popup, menuComp, popupParams, menuParams } = inject('popup')



</script>

<template>
    <Marker v-for="pt in cuePoints" :key="pt.id" :options="getOption(pt)" @click="onClick(pt.id, $event)">

    </Marker>
</template>