<script lang="ts">

import Layout from "@/Layouts/BrmToolLayout.vue"

export default {
    layout: Layout,
}
</script>

<template>
    <Splitpanes class="default-theme" @resized="onResizeVertical">
        <Pane class="left-pane" :size="verticalSize">
            <Splitpanes horizontal @resized="onResizeLeft">
                <pane :size="leftSize">
                    <MapPane />
                </pane>
                <pane :size="100 - leftSize">
                    <ProfileMapPane />
                </pane>
            </Splitpanes>

        </Pane>
        <Pane class="right-pane" :size="100 - verticalSize">
            <Splitpanes horizontal @resized="onResizeRight">
                <pane :size="rightSize">
                    <StreetViewPane />
                </pane>
                <pane :size="100 - rightSize">
                    <CuesheetPane />
                </pane>
            </Splitpanes>

        </Pane>
    </Splitpanes>
</template>

<script setup lang="ts">

import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { computed } from 'vue'
import { useToolStore } from "@/stores/ToolStore"

import MapPane from "@/Components/MapPane.vue"
import ProfileMapPane from '@/Components/ProfileMapPane.vue'
import CuesheetPane from '@/Components/CuesheetPane.vue'
import StreetViewPane from '@/Components/StreetViewPane.vue'

const toolStore = useToolStore()

const verticalSize = computed(() => toolStore.panes.vertical)
const leftSize = computed(() => toolStore.panes.left)
const rightSize = computed(() => toolStore.panes.right)

const onResizeVertical = (dim: any) => {
    toolStore.setPaneSize('vertical', dim[0].size)
}
const onResizeLeft = (dim: any) => {
    toolStore.setPaneSize('left', dim[0].size)
}
const onResizeRight = (dim: any) => {
    toolStore.setPaneSize('right', dim[0].size)
}

</script>

