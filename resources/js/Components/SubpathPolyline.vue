<script setup lang="ts">
import { Polyline } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { computed, inject, ref, watch } from "vue"
import { googleMapsKey } from "./gmap/keys"

type Point = {
    lat?: number
    lng?: number
}

const store = useBrmRouteStore()
const props = defineProps(["visible", "map"])

const subpath = computed(() => store.subpathRange)

const subpathEditMode = computed(() => store.subpathEdit)

const defaultOption = {
    strokeColor: "blue",
    strokeWidth: 2,
    zIndex: 3,
}

const nextToHeadPoint = ref<Point>({ ...subpath.value.points[1] })
const nextToTailPoint = ref<Point>({ ...subpath.value.points[subpath.value.count - 2] })

const headPath = computed(() => {
    return [{ ...subpath.value.points[0] }, nextToHeadPoint]
})

const tailPath = computed(() => {
    return [{ ...subpath.value.points[subpath.value.count - 1] }, nextToTailPoint]
})

const _key = ref()
const editablePath = computed(() => {
    if (subpath.value.tail) {
        return subpath.value.points.slice(subpath.value.head ? 0 : 1)
    } else {
        return subpath.value.points.slice(subpath.value.head ? 0 : 1, -1)
    }
})



const editPathRef = ref<InstanceType<typeof Polyline> | null>(null)

watch(subpathEditMode, mode => {

    if (mode === true) {
        import("@/classes/deleteMenu")
            .then((module) => {

                const deleteMenu = new module.DeleteMenu()
                google.maps.event.addListener(editPathRef.value!.polyline!, 'contextmenu', (e: any) => {
                    if (e.vertex === undefined) {
                        return
                    }
                    deleteMenu.open(props.map, editPathRef.value!.polyline!.getPath(), e.vertex)
                })


            }
            )
        nextToHeadPoint.value = { ...subpath.value.points[1] }
        nextToTailPoint.value = { ...subpath.value.points[subpath.value.count - 2] }

        setInterval(()=>{
            console.log( headPath.value, tailPath.value)
            _key.value=Symbol()},1000)
    }

})
const getOption = (points: any) => {

    return {
        ...defaultOption,
        path: points,
        visible: props.visible,
        editable: subpath.value.editable
    }
}

</script>

<template>
    <template v-if="!subpathEditMode">
        <Polyline v-if="subpath.count" :key="subpath.id" :options="getOption(subpath.points)" />
    </template>
    <template v-else>

        <Polyline :key="_key" :options="getOption(headPath)" />
        <Polyline :key="_key" :options="getOption(tailPath)" />

        <Polyline ref="editPathRef" :options="getOption(editablePath)" />
    </template>
</template>

<style>
.delete-menu {
    position: absolute;
    background: white;
    padding: 3px;
    color: #666;
    font-weight: bold;
    border: 1px solid #999;
    font-family: sans-serif;
    font-size: 12px;
    box-shadow: 1px 3px 3px rgba(0, 0, 0, 0.3);
    margin-top: -10px;
    margin-left: 10px;
    cursor: pointer;
}

.delete-menu:hover {
    background: #eee;
}
</style>