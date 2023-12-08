<template>
    <Marker ref="marker" v-for="(cpt, index) in cuePoints" :key="cpt.id" :options="getOption(cpt)"
        @click="onClick(cpt, $event)" @drag="onDrag(cpt, $event)" @dragend="onDragEnd(cpt, index, $event)"
        @dblclick="onDblClick(cpt, index, $event)" @contextmenu="onContextmenu(cpt)">
    </Marker>
</template>

<script setup lang="ts">

import { ref, watch } from "vue"
import { Marker } from "vue3-google-map"
import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useCuesheetStore } from "@/stores/CueSheetStore"
import { useGmapStore } from "@/stores/GmapStore"
import { useToolStore } from "@/stores/ToolStore"
import { computed, inject } from "vue"
import { googleMapsKey } from "./gmap/keys"
import { CuePoint } from "@/classes/cuePoint"
import { markerIcon } from "@/lib/gmapcueicon"

import type { RoutePoint } from "@/classes/routePoint"
import { ElMessage } from "element-plus"

const routeStore = useBrmRouteStore()
const cuesheetStore = useCuesheetStore()
const gmapStore = useGmapStore()
const toolStore=useToolStore()

const props = defineProps(["visible"])
const cuePoints = computed(() => cuesheetStore.getArray)
const refRoutePoint = ref<RoutePoint | null>()

let timer: number | null = null

const popups = inject(googleMapsKey)
const marker = ref()

const getOption = (cpt: CuePoint) => {

    const zoom = gmapStore.zoom

    let cueType: string
    if (cpt.type !== 'pc') { cueType = cpt.type }
    else {
        cueType = cpt.terminal !== undefined ? cpt.terminal : 'pc'
    }

    const inactive = !cuesheetStore.isActive(cpt)

    let label:string = ''
    switch(cueType){
        case 'cue':
            label=`${cpt.pointNo}`
            break
        case 'pc':
            label=`${cpt.pcLabel}`
            break
        case 'pass':
            label=`${cpt.checkNo}`
            break
        case 'poi':
            label=`${cpt.poiNo}`
            break
    }

    const iconOption = {
        type: cueType,
        inactive,   // gmapcueicon.js の方で inactive === true の場合 type を 'inactive' に設定する
        size: inactive ? (zoom! > 12 ? 'small' : 'mini') : (zoom! > 12 ? 'normal' : (zoom! > 10 ? 'small' : 'mini')),
        label,
        index: cpt.pointNo
    }

    return {
        position: { lat: cpt.lat, lng: cpt.lng },
        opacity: inactive ? 0.75 : 1.0,
        clickable: !inactive,   // このフラグがうまく機能しない ちなみに draggable フラグは機能する
        draggable: true,
        visible: props.visible,
        icon: { url: markerIcon(iconOption) },
        zIndex: inactive ? 1 : 2,
    }
}

watch(refRoutePoint, (currentPt, prevPt) => {
    if (currentPt) {
        currentPt.opacity = 0.8
    }
    if (prevPt) {
        prevPt.opacity = 0.0
    }
})

const onClick = async (cpt: CuePoint, $event: google.maps.MapMouseEvent) => {

    if( !cuesheetStore.isActive(cpt)) return    // Markerオプションで clickableをfalseにしても反応するためこちらで反応しないようにした

    if (timer !== null) { return }

    timer = window.setTimeout(async () => {
        const response: any = await cueMarkerPopup(cpt, 'CuePointMenu')
        timer = null
    }, 250)

}

watch(() => gmapStore.popupCuePoint, async (cpt: CuePoint | undefined) => {
    if (cpt === undefined) return

    gmapStore.resetCuePointTrigger()
    await cueMarkerPopup(cpt, 'CuePointMenu')
})

/**
 * ダブルクリックでキューポイントを参照点に戻す
 */
const onDblClick = (cpt: CuePoint, index: number, $event: google.maps.MapMouseEvent) => {

    clearTimeout(timer!)
    timer = null

    const routePoint = routeStore.getPointById(cpt.routePointId)
    if (routePoint === undefined) return

    const markerObj = marker.value[index]
    markerObj.marker.setPosition(routePoint)
    cpt.setPosition(new google.maps.LatLng(routePoint))

}

const onContextmenu = async (cpt: CuePoint) => {
    popups!.menuParams.value = { cpt }
    const res: any = await cueMarkerPopup(cpt, 'CuePointDeleteConfirmMenu')

    if (res.result === 'delete') {
        toolStore.registerUndo('ポイント削除')
        cuesheetStore.removeCuePoint(cpt.id)
        ElMessage({ type: 'info', message: 'ポイントを削除しました' })
    }
}

const onDrag = (cpt: CuePoint, $event: google.maps.MapMouseEvent) => {
    refRoutePoint.value = routeStore.getClosePoint($event.latLng!)
}

const onDragEnd = async (cpt: CuePoint, index: number, $event: google.maps.MapMouseEvent) => {
    cpt.setPosition($event.latLng!)
    refRoutePoint.value = routeStore.getClosePoint($event.latLng!)
    const routePoint = refRoutePoint.value

    if (routePoint !== null && routeStore.hasCuePoint(routePoint) === null) {

        if (cpt.terminal !== undefined) {
            setTimeout(() => cpt.setPosition(new google.maps.LatLng(routeStore.getPointById(cpt.routePointId)!)), 250)
            routePoint.opacity = 0.0
            ElMessage({ type: 'info', message: 'スタート・ゴールポイントは移動できません' })
            return
        }

        popups!.menuParams.value = { cpt }
        const res: any = await cueMarkerPopup(cpt, 'CuePointReattachMenu')
        if (res.result! === 'reattach') {
            cuesheetStore.reattachCuePoint(cpt, routePoint)

            // マーカーの位置をルートポイントの位置に移動（ダブルクリックと同じ動き）
            const markerObj = marker.value[index]
            markerObj.marker.setPosition(routePoint)
            cpt.setPosition(new google.maps.LatLng(routePoint))
            ElMessage({ type: 'info', message: 'キューポイントを移動しました' })
        }
        routePoint.opacity = 0.0
    }

}

const cueMarkerPopup = async (cpt: CuePoint, menu: string) => {

    if (popups?.popupParams.value.activated) {
        return Promise.reject('n/a')
    }

    popups!.menuParams.value = { cuePoint: cpt }

    // ここで 動的テンプレートのテンプレートを設定している
    // この行を先頭付近に持っていってしまうと先にポップアップの中身がマウントされてしまうために内容（menuParams）が更新されない。
    // かなり悩んだ
    popups!.menuComp.value = menu

    const position = new google.maps.LatLng({ ...cpt })
    const result = await popups!.popup(position!)
    return result
}

</script>

