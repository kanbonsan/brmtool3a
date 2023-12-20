<template>
    <div ref="poi" class="cuesheet">
        <div class="header">
            POIリスト
            <el-button :disabled="selectedPois.length === 0" size="small">削除</el-button>
        </div>
        <el-table :data="data" border style="height:100%" size="small" @row-click="onRowClick"
            :height="`calc( ${height}px - var(--header-height))`" :header-cell-style="headerCellStyle"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="name" label="名称" />
            <el-table-column label="地名" show-overflow-tooltip>
                <template #default="scope">{{ scope.row.address === '' ? '' : `${scope.row.address} 付近` }}</template>
            </el-table-column>
            <el-table-column prop="distDisplay" align="right" header-align="center">
                <template #header>
                    <el-tooltip content="今の地図の中心からの距離">距離(km)</el-tooltip>
                    
                </template>
            </el-table-column> 
            <el-table-column prop="lapDistance" label="区間" width="50" align="right" />
            <el-table-column prop="note" label="備考" width="150" />
        </el-table>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useGmapStore } from '@/stores/GmapStore'
import { useElementBounding } from '@vueuse/core'
import { hubeny } from "@/lib/hubeny"
import { garminIcons } from '@/lib/garminIcons'

const cuesheetStore = useCuesheetStore()
const gmapStore = useGmapStore()
const poiList = computed(() => cuesheetStore.poiData)
const mapCenter = computed(() => gmapStore.currentCenter)

const data = computed(() => {

    const list = poiList.value.map((poi)=>{
        const distance = hubeny(mapCenter.value.lat, mapCenter.value.lng, poi.lat, poi.lng)
        const distDisplay = `${(distance/1000).toFixed(1)}`
        return {distance, distDisplay, ...poi}
    })
    return list.sort((a,b)=>a.distance-b.distance)
})

const poi = ref()
const { height } = useElementBounding(poi)

// 選択されたPOI
const selectedPois = ref([])

const handleSelectionChange = (val) => {
    selectedPois.value = val
    console.log(val)
}

</script>

<style scoped>
.cuesheet {
    --header-height: 40px;
    width: 100%;
    height: 100%;
    text-transform: none;
}

.header {
    height: var(--header-height);
}
</style>