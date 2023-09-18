<script lang="ts">

import Layout from "@/Layouts/BrmToolLayout.vue"
import { useDimension } from "@/Composables/dimension"
const { dimensionUpdate, panes } = useDimension()

export default {
    layout: Layout,
}
</script>

<template>
    <Splitpanes class="default-theme">
        <Pane class="map-pane">
            <MapPane />
        </Pane>
        <Pane class="side-pane">
            <Splitpanes horizontal>
                <pane>
                    <StreetViewPane />
                </pane>
                <pane>
                    <CuesheetPane />
                </pane>
            </Splitpanes>

        </Pane>
    </Splitpanes>
</template>


<script setup lang="ts">

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import MapPane from "@/Components/MapPane.vue"
import CuesheetPane from '@/Components/CuesheetPane.vue'
import StreetViewPane from '@/Components/StreetViewPane.vue'

import TestDiv from "@/Components/TestDiv1.vue"

</script>

