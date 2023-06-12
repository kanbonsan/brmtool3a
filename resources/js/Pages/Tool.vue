<script lang="ts">
import Layout from "@/Layouts/WaveLayout.vue"

export default {
    layout: Layout,
}
</script>

<template>
    <Splitpanes class="default-theme">
        <Pane>
            <GoogleMap ref="gmap" :api-key="apiKey" style="width: 100%; height: 100%" :center="center" :zoom="15"
                v-slot="slotProps">
                <Marker :options="markerOption(pt)" v-for="(pt) in availablePoints" :key="pt.id"
                    @mouseover="markerClick(pt.id)">
                </Marker>
                <BrmPolyline :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" />
                <CustomPopup :api="slotProps.api" :map="slotProps.map" :ready="slotProps.ready" />
            </GoogleMap>
        </Pane>
        <Pane>
            <div id="side">
                <Renderless @testdiv="onTestDiv"><TestDiv  @testdiv="onTestDiv"></TestDiv></Renderless>
                
            </div>
        </Pane>
    </Splitpanes>
</template>


<script setup lang="ts">
import { ref, watch, onMounted, computed, createApp, Component } from "vue"
import WaveUI from 'wave-ui'

import { GoogleMap, Marker, Polyline } from "vue3-google-map"
import brm from "../../sample/sample200.brm.json"

import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useGmapStore } from "@/stores/GmapStore"
import circle from '../../images/pointCircle.png'

import BrmPolyline from "@/Components/BrmPolyline.vue"
import { RoutePoint } from "@/classes/routePoint"

import CustomPopup from "@/Components/CustomPopup.vue"

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { $vfm } from 'vue-final-modal'

import { debounce } from "lodash"

import Renderless from "@/Components/Renderless.vue"
import TestDiv from "@/Components/TestDiv.vue"

const props = defineProps(["canLogin", "canRegister"])

const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 })

const store = useBrmRouteStore()

const availablePoints = computed(() => store.availablePoints)

const gmapStore = useGmapStore()

const gmap = ref<InstanceType<typeof GoogleMap> | null>(null)

const message = ref("")

store.$subscribe((mutation, state) => {
    console.log("changed", mutation.type)
})

onMounted(() => {
    setTimeout(() => {
        store.deviate()
        store.setExclude(10, 50)
        store.setExclude(300, 350)
        console.log('deviated')
    }, 5000)
    setTimeout(() => {
        store.delete(100, 200)
        console.log('delete')
    }, 10000)

})


watch(
    (): boolean | undefined => gmap.value?.ready,
    (ready) => {
        if (!ready || !gmap.value?.api || !gmap.value?.map) {
            return
        }

        const c = TestDiv

        class Popup extends google.maps.OverlayView {
            position: google.maps.LatLng
            containerDiv: HTMLDivElement
    

            constructor(position: google.maps.LatLng, component: Component) {
                super()
                this.position = position

                const content = document.createElement('div')
                
                content.classList.add("popup-bubble")
                const app = createApp(TestDiv).use(WaveUI)
                
                app.mount(content)

                // This zero-height div is positioned at the bottom of the bubble.
                const bubbleAnchor = document.createElement("div")

                bubbleAnchor.classList.add("popup-bubble-anchor")
                bubbleAnchor.appendChild(content)

                // This zero-height div is positioned at the bottom of the tip.
                this.containerDiv = document.createElement("div")

                this.containerDiv.classList.add("popup-container")
                this.containerDiv.appendChild(bubbleAnchor)
                this.containerDiv.addEventListener('menu', (e)=>{console.log('menu subitted',e)})

                // Optionally stop clicks, etc., from bubbling up to the map.
                Popup.preventMapHitsAndGesturesFrom(this.containerDiv)
            }

            /** Called when the popup is added to the map. */
            onAdd() {
                this.getPanes()!.floatPane.appendChild(this.containerDiv)
            }

            /** Called when the popup is removed from the map. */
            onRemove() {
                if (this.containerDiv.parentElement) {
                    this.containerDiv.parentElement.removeChild(this.containerDiv)
                }
            }

            /** Called each frame when the popup needs to draw itself. */
            draw() {
                const divPosition = this.getProjection().fromLatLngToDivPixel(
                    this.position
                )!

                // Hide the popup when it is far out of view.
                const display =
                    Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
                        ? "block"
                        : "none"

                if (display === "block") {
                    this.containerDiv.style.left = divPosition.x + "px"
                    this.containerDiv.style.top = divPosition.y + "px"
                }

                if (this.containerDiv.style.display !== display) {
                    this.containerDiv.style.display = display
                }
            }
        }

        /** Google Map インスタンス */
        const api = gmap.value.api
        const map = gmap.value.map

        gmapStore.map = map

        /** ルートの設定 */
        store.setPoints(brm.encodedPathAlt)

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

        map.addListener("click", (ev: google.maps.MapMouseEvent) => {
            console.log(`${ev.latLng?.lat()}:${ev.latLng?.lng()}`)
            if (ev.latLng) {
                const pup = new Popup(ev.latLng, TestDiv)
                pup.setMap(map)
            }
        })
    }
)

const markerOption = (pt: RoutePoint) => {
    return {
        position: pt,
        opacity: pt.opacity,
        icon: circle
    }
}

const markerClick = (id: symbol) => {
    const ptIndex = store.getPointById(id)
    store.points[ptIndex].opacity = 0.5
}

const onTestDiv = ()=>{console.log('click on testdiv')}
</script>

<style>
/* The popup bubble styling. */
.popup-bubble {
    /* Position the bubble centred-above its parent. */
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(-50%, -100%);
    /* Style the bubble. */
    background-color: white;
    padding: 5px;
    border-radius: 5px;
    font-family: sans-serif;
    overflow-y: auto;
    max-height: 500px;
    box-shadow: 0px 2px 10px 1px rgba(0, 0, 0, 0.5);
}

/* The parent of the bubble. A zero-height div at the top of the tip. */
.popup-bubble-anchor {
    /* Position the div a fixed distance above the tip. */
    position: absolute;
    width: 100%;
    bottom: 8px;
    left: 0;
}

/* This element draws the tip. */
.popup-bubble-anchor::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    /* Center the tip horizontally. */
    transform: translate(-50%, 0);
    /* The tip is a https://css-tricks.com/snippets/css/css-triangle/ */
    width: 0;
    height: 0;
    /* The tip is 8px high, and 12px wide. */
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid white;
}

/* JavaScript will position this div at the bottom of the popup tip. */
.popup-container {
    cursor: auto;
    height: 0;
    position: absolute;
    /* The max width of the info window. */
    width: 100%;
}
</style>

