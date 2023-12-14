<template>
    <div ref="pane" class="cuesheet-pane">
        <div style="position:absolute;top:5px;right:3px;">
            <el-switch v-model="viewCueTable"
            style="--el-switch-off-color: #13ce66"
            size="small"
            active-text="キューシート"
            inactive-text="POI"></el-switch></div>
        <KeepAlive>
            <component :is="tableComponent" />
        </KeepAlive>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useToolStore } from '@/stores/ToolStore'
import { useGmapStore } from '@/stores/GmapStore'
import { useElementBounding } from '@vueuse/core'
import CuesheetTable from "@/Components/cuesheet/CuesheetTable.vue"
import PoiTable from './cuesheet/PoiTable.vue'

// 表示するページ 
const viewCueTable = ref(true)
const tableComponent = computed(() => {
    return viewCueTable.value ? CuesheetTable : PoiTable
})
</script>


<style scoped>
.cuesheet-pane {
    position: relative;
    width: 100%;
    height: 100%;
}
</style>