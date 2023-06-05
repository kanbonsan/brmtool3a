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
            </GoogleMap>
        </Pane>
        <Pane>
            <div id="side">
                もともとの内容
            </div>
        </Pane>
    </Splitpanes>
</template>


<script setup lang="ts">
import { ref, watch, onMounted, computed, createApp } from "vue"
import type { Ref } from "vue"

import { GoogleMap, Marker, Polyline } from "vue3-google-map"
import brm from "../../sample/sample200.brm.json"

import { useBrmRouteStore } from "@/stores/BrmRouteStore"
import { useGmapStore } from "@/stores/GmapStore"
import circle from '../../images/pointCircle.png'

import BrmPolyline from "@/Components/BrmPolyline.vue"

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import { $vfm } from 'vue-final-modal'

import { debounce } from "lodash"

import TestDiv from "@/Components/TestDiv.vue"

const props = defineProps(["canLogin", "canRegister"])

const apiKey = ref(import.meta.env.VITE_GOOGLE_MAPS_KEY)
const center = ref({ lat: 35.2418, lng: 137.1146 })

const store = useBrmRouteStore()

const availablePoints = computed(() => store.availablePoints)

const gmapStore = useGmapStore()

const gmap = ref<InstanceType<typeof GoogleMap>|null>(null)

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

    createApp(TestDiv).mount("#side")

})


watch(
    (): boolean|undefined => gmap.value?.ready,
    (ready) => {
        if (!ready) {
            return
        }
        if(gmap.value === null) return
        const map = gmap.value.map
        gmapStore.map = map
        store.setPoints(brm.encodedPathAlt)

        map.addListener(
            "bounds_changed",
            debounce(() => {
                const _bb = map.getBounds()
                const _sw = _bb.getSouthWest()
                const _ne = _bb.getNorthEast()
                gmapStore.bounds = {
                    north: _ne.lat(),
                    south: _sw.lat(),
                    east: _ne.lng(),
                    west: _sw.lng(),
                }
                gmapStore.latLngBounds = map.getBounds()
            }, 200)
        )
        map.addListener("zoom_changed", () => {
            message.value = map.getZoom()
            gmapStore.zoom = `zoom: ${map.getZoom()}`
        })
        map.addListener("click", (ev) => {
            message.value = `${ev.latLng.lat()}:${ev.latLng.lng()}`
        })

        class Popup extends gmap.value.api.OverlayView {
            position: google.maps.LatLng
            containerDiv: HTMLDivElement

            constructor(position: google.maps.LatLng, content: HTMLElement) {
                super()
                this.position = position

                content.classList.add("popup-bubble")

                // This zero-height div is positioned at the bottom of the bubble.
                const bubbleAnchor = document.createElement("div")

                bubbleAnchor.classList.add("popup-bubble-anchor")
                bubbleAnchor.appendChild(content)

                // This zero-height div is positioned at the bottom of the tip.
                this.containerDiv = document.createElement("div")
                this.containerDiv.classList.add("popup-container")
                this.containerDiv.appendChild(bubbleAnchor)

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

    }
)

const markerOption = (pt) => {
    return {
        position: pt,
        opacity: pt.opacity,
        icon: circle
    }
}

const markerClick = (id) => {
    const ptIndex = store.getPointById(id)
    store.points[ptIndex].opacity = 0.5
    console.log("marker index:%d, id:%d clicked", ptIndex, id)
}
</script>

