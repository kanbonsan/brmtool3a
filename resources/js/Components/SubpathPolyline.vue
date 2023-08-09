<script setup lang="ts">
import { Polyline, Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useToolStore } from "@/stores/ToolStore"
import { computed, inject, ref, watch } from "vue"
import { googleMapsKey } from "./gmap/keys"
import { DirectionReference } from "@/config"

type Point = {
    lat?: number
    lng?: number
}

const store = useBrmRouteStore()
const toolStore = useToolStore()

const props = defineProps(["visible", "map"])

const subpath = computed(() => store.subpathRange)

const subpathEditMode = computed(() => toolStore.subpathEditMode)
const subpathDirectionMode = computed(() => toolStore.subpathDirectionMode)

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


// ルート探索
const controlPoints = ref<Array<{ lat: number, lng: number, terminal: boolean }>>([])
const dirPathRef = ref<InstanceType<typeof Polyline>>()

const dirHeadPath = computed(() => {
    if (controlPoints.value.length === 0) return []
    return controlPoints.value.slice(0, 2)
})
const dirTailPath = computed(() => {
    const length = controlPoints.value.length
    if (length === 0) return []

    return controlPoints.value.slice(-2)
})

const dirCtrlPath = computed(() => {
    const length = controlPoints.value.length
    if (length === 0) return []

    return controlPoints.value.slice(1, -1)
})



watch([subpathEditMode, subpathDirectionMode], ([editMode, directionMode]) => {

    if (editMode === true) {
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

    }
    // ルート探索モード
    if (directionMode === true) {

        import("@/classes/deleteMenu")
            .then((module) => {
                const deleteMenu = new module.DeleteMenu()
                const poly = dirPathRef.value?.polyline!
                google.maps.event.addListener(poly, 'contextmenu', (e: any) => {
                    if (poly.getPath().getLength() < 3) {
                        return  // 2点は残す
                    }
                    if (e.vertex === undefined) {
                        return
                    }
                    deleteMenu.open(props.map, poly.getPath(), e.vertex, onDirectionUpdate)
                })

            })
        const beginDist = subpath.value.points[0].routeDistance
        const endDist = subpath.value.points.slice(-1)[0].routeDistance
        const diffDist = endDist - beginDist

        controlPoints.value.push({ ...subpath.value.points[0], terminal: true })
        for (let i = 0; i < DirectionReference; i++) {
            controlPoints.value.push({ ...store.getLocationByDistance(beginDist + diffDist / (DirectionReference + 1) * (i + 1)), terminal: false })
        }
        controlPoints.value.push({ ...subpath.value.points.slice(-1)[0], terminal: true })
        store.setSubpathDirectionControlPoints(controlPoints.value)

    } else {
        controlPoints.value.splice(0)
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
const getDirOption = (points: any, editable: boolean = true) => {

    return {
        ...defaultOption,
        strokeColor: "green",
        path: points,
        visible: props.visible,
        editable: editable
    }
}

const onDirectionUpdate = (ev: google.maps.PolyMouseEvent) => {

    const length = controlPoints.value.length
    const poly = dirPathRef.value?.polyline!
    const points = poly.getPath().getArray().map((latlng)=>({lat:latlng.lat(),lng:latlng.lng(),terminal:false}))
    controlPoints.value.splice(1, length - 2, ...points)
    store.setSubpathDirectionControlPoints(controlPoints.value)
}


</script>

<template>
    <template v-if="!subpathEditMode && !subpathDirectionMode">
        <Polyline v-if="subpath.count" :key="subpath.id" :options="getOption(subpath.points)" />
    </template>
    <template v-if="subpathEditMode">
        <Polyline :options="getOption(headPath, false)" />
        <Polyline :options="getOption(tailPath, false)" />
        <Polyline ref="editPathRef" :options="getOption(editablePath, true)" @mouseup="onEditUpdate" />
    </template>
    <template v-if="subpathDirectionMode">
        <Polyline :options="getDirOption(dirHeadPath, false)" />
        <Polyline :options="getDirOption(dirTailPath, false)"/>
        <Polyline ref="dirPathRef" :options="getDirOption(dirCtrlPath, true)" @mouseup="onDirectionUpdate"/>
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