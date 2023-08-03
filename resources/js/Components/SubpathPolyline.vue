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

const editReady = ref<boolean>(false)

const defaultOption = {
    strokeColor: "blue",
    strokeWidth: 2,
    zIndex: 3,
}

const nextToHeadPoint = ref<Point>({ ...subpath.value.points[1] })
const nextToTailPoint = ref<Point>({ ...subpath.value.points[subpath.value.count - 2] })

const headPath = computed(() => {

    return [{ ...subpath.value.points[0] }, nextToHeadPoint.value]
})

const tailPath = computed(() => {
    return [{ ...subpath.value.points[subpath.value.count - 1] }, nextToTailPoint.value]
})


const editablePath = computed(() => {
    if (!subpath.value.tail) {
        return subpath.value.points.slice(subpath.value.head ? 1 : 0)
    } else {
        return subpath.value.points.slice(subpath.value.head ? 1 : 0, -1)
    }
})

const onEditUpdate = (ev: google.maps.PolyMouseEvent) => {
    const path = editPathRef.value?.polyline?.getPath()
    const length = path?.getLength()
    const _head = path?.getAt(0)
    const _tail = path?.getAt(length! - 1)

    nextToHeadPoint.value = { lat: _head?.lat(), lng: _head?.lng() }
    nextToTailPoint.value = { lat: _tail?.lat(), lng: _tail?.lng() }

    // 現在のパスを保存
    const points: Array<{ lat: number, lng: number }> = []
    if (subpath.value.head) {
        points.push(subpath!.value.points[0])
    }
    editPathRef.value?.polyline?.getPath().getArray().forEach(pt => points.push({ lat: pt.lat(), lng: pt.lng() }))
    if (subpath.value.tail) {
        points.push(subpath.value.points.slice(-1)[0])
    }

    store.setSubpathTempPath(points)
}



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
                    deleteMenu.open(props.map, editPathRef.value!.polyline!.getPath(), e.vertex, onEditUpdate)
                })


            }
            )
        nextToHeadPoint.value = { ...subpath.value.points[1] }
        nextToTailPoint.value = { ...subpath.value.points[subpath.value.count - 2] }

    } else {
        console.log('サブパスを解除しなければ')
    }

})
const getOption = (points: any, editable: boolean = true) => {

    return {
        ...defaultOption,
        path: points,
        visible: props.visible,
        editable: subpath.value.editable && editable
    }
}

</script>

<template>
    <template v-if="!subpathEditMode">
        <Polyline v-if="subpath.count" :key="subpath.id" :options="getOption(subpath.points)" />
    </template>
    <template v-else>
        <Polyline :options="getOption(headPath, false)" />
        <Polyline :options="getOption(tailPath, false)" />
        <Polyline ref="editPathRef" :options="getOption(editablePath)" @mouseup="onEditUpdate" />
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