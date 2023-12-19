<template>
    <div ref="gmapPane" style="position:relative;width:100%;height:100%;">
        <GoogleMap ref="gmap" :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="15"
            v-slot="{ api, map, ready }">
            <Marker :options="markerOption(pt)" v-for="(pt) in availablePoints" :key="pt.id" @click="markerClick(pt)"
                @mouseover="markerMouseover(pt)" @mouseout="markerMouseout(pt)">
            </Marker>
            <BrmPolyline :api="api" :map="map" :ready="ready" :visible="mapObjectVisible" />
            <CustomPopup ref='cusp' :api="api" :map="map" :ready="ready" :params="popupParams" v-slot="{ submit }">
                <component :is="menus[menuComp]?.component" :submit="submit" :menuParams="menuParams"></component>
            </CustomPopup>
            <CuePointMarker :api="api" :map="map" :ready="ready" :visible="mapObjectVisible" />
            <CustomControl position="TOP_LEFT">
                <el-dropdown style="margin-left:10px;margin-top:10px;" @command="changeMap">
                    <el-button>
                        地図変更<el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="ROADMAP">通常マップ</el-dropdown-item>
                            <el-dropdown-item command="SATELLITE">航空写真</el-dropdown-item>
                            <el-dropdown-item command="HYBRID">航空+道路</el-dropdown-item>
                            <el-dropdown-item command="TERRAIN">地形図</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </CustomControl>
            <CustomControl position="BOTTOM_CENTER">
                <el-button style="margin-bottom:15px;" :disabled="!isEditMode"
                    @click="openDrawer('editableRange')">編集範囲</el-button>
            </CustomControl>
            <ProfileMarker />
        </GoogleMap>
        <Teleport to="body">
            <lower-drawer v-model="drawerActive" :title="drawers[drawerComp]?.title" :tooltip="drawers[drawerComp].tooltip"
                :timeout="drawers[drawerComp]?.timeout" :height="drawers[drawerComp].drawerHeight"
                @timeout="drawers[drawerComp]?.timeoutFunc" @submit="onLowerDrawerSubmit" v-slot="{ reset, submit }">
                <component :is="drawers[drawerComp]?.component" :resetTimeout="reset" :submitFunc="submit"></component>
            </lower-drawer>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted, computed, provide } from "vue"
import type { Component } from 'vue'

import { GoogleMap, Marker, CustomControl } from "vue3-google-map"
import { googleMapsKey } from "@/Components/gmap/keys"
import axios from "axios"
import { useMouseInElement } from '@vueuse/core'

import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useCuesheetStore } from "@/stores/CueSheetStore"
import { useGmapStore } from "@/stores/GmapStore"
import { useToolStore } from "@/stores/ToolStore"
import { useProfileStore } from "@/stores/ProfileStore"
import circle from '../../images/pointCircle.png'

import BrmPolyline from "@/Components/BrmPolyline.vue"
import { RoutePoint } from "@/classes/routePoint"

import CustomPopup from "@/Components/CustomPopup.vue"
import { debounce } from "lodash"

import LowerDrawer from "@/Components/gmap/LowerDrawer.vue"
import EditableRangeSlider from "./gmap/EditableRangeSlider.vue"
import SubpathRangeSlider from "./gmap/SubpathRangeSlider.vue"
import SubpathCommand from "./gmap/SubpathCommand.vue"
import SubpathEditConfirm from "./gmap/SubpathEditConfirm.vue"
import SubpathDirection from "./gmap/SubpathDirection.vue"
import SubpathDirectionConfirm from "./gmap/SubpathDirectionConfirm.vue"
import SubpathDeleteConfirm from "./gmap/SubpathDeleteConfirm.vue"
import SubpathFlatConfirm from "./gmap/SubpathFlatConfirm.vue"

// ポップアップメニュー
import ExcludePolyMenu from "@/Components/PopupMenu/ExcludedPolylineMenu.vue"
import PointMenu from "@/Components/PopupMenu/PointMenu.vue"
import CuePointMenu from "./PopupMenu/CuePointMenu.vue"
import CuePointReattachMenu from "./PopupMenu/CuePointReattachMenu.vue"
import CuePointDeleteConfirmMenu from "./PopupMenu/CuePointDeleteConfirmMenu.vue"

import CuePointMarker from "./CuePointMarker.vue"
import ProfileMarker from "@/Components/gmap/ProfileMarker.vue"

export type menuComponentOptions = {
    /**
     * ポップアップ下中央の座標をずらすpx
     */
    offsetX?: number
    offsetY?: number
    width?: number
    height?: number
    /**
     * タイムアウト ms
     */
    timeout?: number | undefined    // nullable で auto close しない
}

export type menuComponent = {
    component: Component
    options?: menuComponentOptions
}

export type Activator = RoutePoint

export type Menus = {
    [key: string]: menuComponent
}
export type PopUp = (position: google.maps.LatLng, activator?: Activator) => Promise<unknown>


// 地図下のドロアーメニュー    

export type drawerComponent = {
    component: Component
    title?: string
    timeout: number,
    timeoutFunc?: () => void,   // タイムアウト時の後処理
    drawerHeight?: number,
    tooltip?: string
}
export type Drawers = {
    [key: string]: drawerComponent
}

const gmap = ref<InstanceType<typeof GoogleMap>>()
const gmapPane = ref(null)
const { isOutside } = useMouseInElement(gmapPane)

const defaultOptions: menuComponentOptions = {
    offsetX: 0,
    offsetY: 0,
    timeout: undefined
}


/**
 * CustomPopup 内に表示する slot の内容
 */
const menus: Menus = {
    ExcludePoly: {
        component: ExcludePolyMenu,
        options: { timeout: 3_000 }
    },
    PointMenu: {
        component: PointMenu,
        options: { timeout: 50_000, offsetY: 0 }
    },
    CuePointMenu: {
        component: CuePointMenu,
        options: { timeout: 50_000, offsetY: -30 }
    },
    CuePointReattachMenu: {
        component: CuePointReattachMenu,
        options: { timeout: 10_000, offsetY: -30 }
    },
    CuePointDeleteConfirmMenu: {
        component: CuePointDeleteConfirmMenu,
        options: { timeout: 5_000, offsetY: 0 }
    }
}

const menuParams = ref<any>({})

/**
 * LowerDrawerメニューの内容
 */
const drawers: Drawers = {
    Editable: {
        component: EditableRangeSlider,
        title: "編集範囲",
        tooltip: "編集範囲を限定することで重なった部分の編集をしやすくします",
        timeout: 15_000,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
        },
        drawerHeight: 120
    },
    Subpath: {
        component: SubpathRangeSlider,
        title: "サブパス設定",
        tooltip: "操作するサブパス範囲を設定します",
        timeout: 15_000,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
        },
        drawerHeight: 120
    },
    SubpathCommand: {
        component: SubpathCommand,
        title: "サブパス操作",
        tooltip: "サブパスに対するコマンドを選択します",
        timeout: 0,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
        },
        drawerHeight: 120

    },
    SubpathEditConfirm: {
        component: SubpathEditConfirm,
        title: "サブパス編集",
        timeout: 0,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.subpathTempPathTouched = false
            routeStore.resetSubpath()
        }
    },
    SubpathDeleteConfirm: {
        component: SubpathDeleteConfirm,
        title: "ポイント削除",
        timeout: 0,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
        }
    },
    SubpathDirection: {
        component: SubpathDirection,
        title: "ルート探索",
        timeout: 0,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
        }
    },
    SubpathDirectionConfirm: {
        component: SubpathDirectionConfirm,
        title: "ルート検索",
        timeout: 0,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
        }
    },
    SubpathFlatConfirm: {
        component: SubpathFlatConfirm,
        title: "標高のフラット化",
        timeout: 0,
        timeoutFunc: () => {
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
        },
        drawerHeight: 150
    },
}

//マップ上の表示を一時消去するタイマー（重複処理用）
let mapObjectVisibleTimer: number | null = null
const mapObjectVisible = ref<boolean>(true)

const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 }) // デフォルトの地図の中心（瀬戸しなの）

const routeStore = useBrmRouteStore()
const gmapStore = useGmapStore()
const cuesheetStore = useCuesheetStore()
const toolStore = useToolStore()
const profileStore = useProfileStore()

const availablePoints = computed(() => routeStore.availablePoints)
const isEditMode = computed(() => gmapStore.editMode) // 画面下の「編集範囲」ボタンは編集モード時のみ作動させる

const menuComp = ref<string>('')
const popupParams = ref<{
    activated?: boolean,
    activator?: RoutePoint, // popup の対象オブジェクト（eg メニュー表示中にマーカーを消さないように）
    position?: google.maps.LatLng,
    options?: menuComponentOptions,
    resolve?: (payload: any) => void
    reject?: (payload: any) => void
}>({ activated: false })

onUnmounted(() => {
    toolStore.save()
})

watch(
    (): boolean | undefined => gmap.value?.ready,
    async (ready) => {
        if (!ready || !gmap.value?.api || !gmap.value?.map) {
            return
        }

        /** Google Map インスタンス */
        const api = gmap.value.api
        const map = gmap.value.map

        gmapStore.map = map
        gmapStore.ready = ready

        map.setOptions({
            fullscreenControl: false,
            mapTypeControl: false,
            scaleControl: true,
            zoomControl: true,
            streetViewControl: true,
            mapTypeId: api.MapTypeId[gmapStore.mapType]

        })

        /** ルートの設定 */

        const result = await toolStore.restore()

        map.addListener(
            "bounds_changed",
            debounce(() => {
                const _bb = map.getBounds()
                const _sw = _bb?.getSouthWest()
                const _ne = _bb?.getNorthEast()
                gmapStore.bounds = {
                    north: _ne?.lat(),
                    south: _sw?.lat(),
                    east: _ne?.lng(),
                    west: _sw?.lng(),
                }
                gmapStore.latLngBounds = _bb
            }, 200)
        )

        map.addListener("zoom_changed",
            () => {
                gmapStore.zoom = map.getZoom()
            })

        map.addListener("click", async (ev: google.maps.MapMouseEvent) => {
            console.log(ev.latLng?.lat(), ev.latLng?.lng())
            const result = await axios({
                method: "get",
                url: "/api/getAlt",
                params: {
                    lat: ev.latLng?.lat(),
                    lng: ev.latLng?.lng(),
                }
            })
            console.log(result.data)
        })

        // マップ中心を記録（POIリストの距離ソート用）
        map.addListener("center_changed", ()=>{
            const center = map.getCenter()
            gmapStore.currentCenter = { lat: center?.lat()!, lng: center?.lng()!}
        })

        // 地図上右クリックで画面上の polyline などを一時消去
        map.addListener("contextmenu", (ev: google.maps.MapMouseEvent) => {
            if (mapObjectVisibleTimer != null) {
                clearTimeout(mapObjectVisibleTimer)
            }
            mapObjectVisibleTimer = window.setTimeout(() => { mapObjectVisible.value = true }, 1500)
            mapObjectVisible.value = false
        })
    },
    { immediate: true }
)

watch(() => gmapStore.center, async (newCenter) => {
    gmapStore.map?.setCenter(newCenter)
}, { deep: true })

watch(() => gmapStore.zoomBounds, async (newBB) => {
    if (!newBB) return
    gmapStore.map?.fitBounds(newBB!)
})

watch(() => gmapStore.zoom, async (newZoom, oldZoom) => {
    if (!newZoom || newZoom === oldZoom) return
    gmapStore.map?.setZoom(newZoom)
})

watch(()=>gmapStore.mapType, (mapType)=>{
    const id=gmap.value?.api?.MapTypeId[mapType]!
    gmapStore.map?.setMapTypeId(id)
})

watch(() => isOutside, (status) => {
    // マウスポインタがマップから出たらプロフィール上のガイドは消去
    // 本来必要ないはずだがゴミが残らないように一応設定しておく
    if (!status) {
        profileStore.setRoutePoint(undefined)
    }
})

// Lower Drawer Menu
/**
 * Drawer 開閉のためのスイッチ
 * 0: false, >0 で true
 * boolean としないのは、表示の更新時に autoclose のタイマーをリセットするため
 */
const drawerActive = ref<number>(0)
/**
 * Drawer の表示内容
 */
const drawerComp = ref<string>('Editable')


// ポイントマーカー

const markerOption = (pt: RoutePoint) => {
    return {
        position: pt,
        opacity: pt.opacity,
        icon: { url: circle, anchor: new google.maps.Point(8, 8) },
        visible: mapObjectVisible.value && pt.editable && !pt.excluded && !gmapStore.subpathEditMode && !gmapStore.subpathDirectionMode
    }
}

const markerClick = async (pt: RoutePoint) => {

    pt.opacity = 0.5

    // popup を開く。閉じられて　Promise が返るまで待機。
    const response: any = await markerPopup(pt)
    pt.opacity = 0.0

    if (response.status == 'success') {

        switch (response.result) {
            case 'addCuePoint':
                cuesheetStore.addCuePoint(pt)
                break
            case 'moveStreetview':
                gmapStore.moveStreetViewByPoint(pt, 50)
                gmapStore.setGuideMarkers(pt)
                gmapStore.setZoom(14)
                break
            case 'editableRange':
                drawerComp.value = 'Editable'
                drawerActive.value += 1
                break
            case 'editFormer':
                routeStore.setEditRangeEnd(routeStore.getPointIndex(pt))
                break
            case 'editLatter':
                routeStore.setEditRangeBegin(routeStore.getPointIndex(pt))
                break
            case 'subpathBegin':
                gmapStore.setMode('subpathSelect')
                routeStore.resetSubpath(pt) // サブパスインデックスの設定
                drawerComp.value = 'Subpath'
                drawerActive.value += 1
                break
            case 'subpathEnd':
                gmapStore.setMode('subpath')
                drawerComp.value = 'SubpathCommand'
                drawerActive.value += 1
                routeStore.subpathSync()
                break
        }
    }

}

const markerMouseover = (pt: RoutePoint) => {

    const ptIndex = routeStore.getPointIndex(pt)

    if (popupParams.value.activator === pt) {
        return
    }

    if (!pt.editable) return

    // プロフィールマップにガイドを表示させるためにポイントを設定
    profileStore.setRoutePoint(pt)

    if (gmapStore.subpathSelectMode) {
        const _begin: number = Math.min(ptIndex, routeStore.subpathTemp.begin!)
        const _end: number = Math.max(ptIndex, routeStore.subpathTemp.end!)
        routeStore.setSubpath([_begin, _end])
    }

    pt.opacity = 0.8

}

const markerMouseout = (pt: RoutePoint) => {

    profileStore.setRoutePoint(undefined)

    if (popupParams.value.activator === pt) {
        return
    }

    if (!pt.editable) return

    if (gmapStore.subpathSelectMode) {

        routeStore.setSubpath([routeStore.subpathTemp.begin!, routeStore.subpathTemp.end!])
    }

    pt.opacity = 0.0

}

const markerPopup = async (pt: RoutePoint) => {

    if (popupParams.value.activated) {
        return Promise.reject('n/a')
    }
    menuComp.value = 'PointMenu'
    menuParams.value = { pt }

    const position = new google.maps.LatLng(pt)

    const result = await popup(position, pt)

    return result

}


const popup: PopUp = async (position, activator?) => {

    /**
     * Promiseオブジェクトの resolve 関数を取り出して子コンポーネントに渡して
     * そちらで解決する。
     * 長らく悩んでいた問題が解決！！ 
     * 「VueでもユーザーのタイミングでPromiseをresolve()できへんか？」(Web page)
     */

    return new Promise((resolve, reject) => {

        const resolveFunc = (payload: any) => {
            popupParams.value.activated = false
            popupParams.value.activator = undefined
            menuComp.value = ''
            resolve(payload)
        }

        popupParams.value = {
            activated: true,
            activator,
            resolve: resolveFunc,
            reject: reject,
            position: position,
            options: Object.assign({}, defaultOptions, menus[menuComp.value].options)
        }
    })

}

const openDrawer = (cmd: string) => {
    switch (cmd) {
        case 'editableRange':
            drawerComp.value = 'Editable'
            drawerActive.value += 1
            break
    }
}

/**
 * 画面下のドロワー内 slot からの submit をキャッチ
 * @param payload 
 */
const onLowerDrawerSubmit = async (command: string, options?: any) => {
    switch (command) {
        // サブパスをキャンセル
        case 'ReturnToEdit':
            gmapStore.setMode('edit')
            routeStore.resetSubpath()
            drawerActive.value = 0
            break
        case 'subpathRange:submit':
            gmapStore.setMode('subpath')
            drawerComp.value = 'SubpathCommand'
            drawerActive.value += 1
            break
        case 'subpath:pathEdit':
            gmapStore.setMode('subpathEdit')
            routeStore.subpathTempPathTouched = false
            drawerComp.value = 'SubpathEditConfirm'
            drawerActive.value += 1
            break
        case 'subpath:editPathConfirm':
            toolStore.registerUndo('サブパス編集')
            routeStore.subpathReplace(options?.deletePoi)
            routeStore.resetSubpath()
            gmapStore.setMode('edit')
            drawerActive.value = 0
            break
        case 'subpath:delete':
            drawerComp.value = 'SubpathDeleteConfirm'
            drawerActive.value += 1
            break
        case 'subpath:deleteConfirm':
            toolStore.registerUndo('サブパス削除')
            routeStore.subpathDelete(options?.deletePoi)
            routeStore.resetSubpath()
            gmapStore.setMode('edit')
            drawerActive.value = 0
            break
        case 'subpath:exclude':
            toolStore.registerUndo('サブパス除外')
            routeStore.subpathSetExclude()
            routeStore.resetSubpath()
            gmapStore.setMode('edit')
            drawerActive.value = 0
            break
        case 'subpath:direction':
            gmapStore.setMode('subpathDirection')
            drawerComp.value = 'SubpathDirection'
            drawerActive.value += 1
            break
        case 'subpath:directionQuery':
            await routeStore.directionQuery()
            gmapStore.setMode('subpathDirectionConfirm')
            drawerComp.value = 'SubpathDirectionConfirm'
            drawerActive.value += 1
            break
        case 'subpath:flat':
            drawerComp.value = 'SubpathFlatConfirm'
            drawerActive.value += 1
            break
        case 'subpath:flatConfirm':
            toolStore.registerUndo('トンネル化')
            routeStore.subpathAltFlat()
            routeStore.resetSubpath()
            gmapStore.setMode('edit')
            drawerActive.value = 0
            break

    }
}

// 地図左上メニュー（地図変更）
const changeMap = (mapType: any) => {
    gmapStore.setMapType(mapType)
}

provide(googleMapsKey, { popup, menuComp, popupParams, menuParams })

</script>