
<script setup>
import { ref, watch, onMounted, computed, inject } from "vue";
import { useBrmRouteStore } from "@/stores/BrmRouteStore";
import ExcludedPolyline from "./ExcludedPolyline.vue"

const props = defineProps(["api", "map", "ready"]);
const store = useBrmRouteStore();

const polylineOptions = {
    strokeColor: "red",
    strokeWidth: 2,
};

watch(
    () => props.ready,
    (ready) => {
        if (!ready) {
            console.log("not ready");
            return;
        }

        const poly = new props.api.Polyline(polylineOptions);
        poly.setPath(store.polylinePoints);
        poly.setMap(props.map);

        store.$subscribe(() => {
            poly.setPath(store.polylinePoints);
        });
    }
);
</script>

<template>
    <ExcludedPolyline/>
</template>
