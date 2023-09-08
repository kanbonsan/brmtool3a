<script lang="ts">

import Layout from "@/Layouts/BrmToolLayout.vue"
import { useDimension } from "@/Composables/dimension"
const { dimensionUpdate, panes } = useDimension()

export default {
    layout: Layout,
}
</script>

<template>
    <Splitpanes class="default-theme" @resized="dimensionUpdate">
        <Pane class="map-pane">
            <MapPane />
        </Pane>
        <Pane class="side-pane">
            <div>

                <TestDiv @testdiv="onTestDiv"></TestDiv>

            </div>
        </Pane>
    </Splitpanes>
</template>


<script setup lang="ts">

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'


import MapPane from "@/Components/MapPane.vue"

import TestDiv from "@/Components/TestDiv1.vue"
const props = defineProps(["canLogin", "canRegister"])

const onTestDiv = () => { console.log('click on testdiv') }

</script>

