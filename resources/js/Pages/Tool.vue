<script lang="ts">
import Layout from "@/Layouts/WaveLayout.vue"

export default {
    layout: Layout,
}
</script>

<template>
    <Splitpanes class="default-theme">
        <Pane>
            <MapPane></MapPane>
        </Pane>
        <Pane>
            <div id="side">
                <Renderless @testdiv="onTestDiv">
                    <TestDiv @testdiv="onTestDiv"></TestDiv>
                </Renderless>

            </div>
        </Pane>
    </Splitpanes>
</template>


<script setup lang="ts">
import { ref, watch, onMounted, computed, createApp, Component } from "vue"
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import MapPane from "@/Components/MapPane.vue"

import Renderless from "@/Components/Renderless.vue"
import TestDiv from "@/Components/TestDiv1.vue"

const props = defineProps(["canLogin", "canRegister"])


const onTestDiv = () => { console.log('click on testdiv') }
</script>

