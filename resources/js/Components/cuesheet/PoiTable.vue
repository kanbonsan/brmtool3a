<template>
    <div ref="poi" class="cuesheet">
        <div class="header">
            POIリスト
            <el-button :disabled="selectedPois.length === 0" size="small">削除</el-button>
        </div>
        <el-table :data="data" border style="height:100%" size="small"
        @row-click="onRowClick"
            :height="`calc( ${height}px - var(--header-height))`" :header-cell-style="headerCellStyle"
            header-cell-class-name="header-cell"
            @selection-change="handleSelectionChange" @sort-change="handleSortChange" @cell-mouse-enter="handleMouseEnter"
            @cell-mouse-leave="handleMouseLeave">
            <el-table-column type="selection" width="50" />
            <el-table-column prop="name" label="名称" show-overflow-tooltip header-align="center" sortable="custom">
                <template #default="{ row }">
                    <span style="font-weight:bold;padding-right:5px">{{ row.poiNo }})</span><span>{{ row.name }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="loc" label="場所" show-overflow-tooltip header-align="center" sortable="custom">
                <template #default="{ row }">{{ row.address === '' ? '' : `${row.address} 付近` }}</template>
            </el-table-column>
            <el-table-column prop="distDisplay" align="right" header-align="center" sortable="custom">
                <template #header>
                    <el-tooltip content="今の地図の中心からの距離(km)">距離</el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="note" label="備考" width="150" header-align="center" />
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
const sortProp = ref('name')
const sortOrder = ref('ascending')

const data = computed(() => {

    const list = poiList.value.map((poi) => {
        const distance = hubeny(mapCenter.value.lat, mapCenter.value.lng, poi.lat, poi.lng)
        const distDisplay = `${(distance / 1000).toFixed(1)}`
        return { distance, distDisplay, ...poi }
    })
    return list.sort((x, y) => {
        let a = x.distance
        let b = y.distance
        switch (sortProp.value) {
            case 'name':
                a = x.poiNo
                b = y.poiNo
                break
            case 'loc':
                a = x.address
                b = y.address
                break
            case 'distDisplay':
                a = x.distance
                b = y.distance
                break
        }
        const comp = a === b ? 0 : (a > b ? 1 : -1)
        return sortOrder.value === 'ascending' ? comp : -comp
    })
})

const poi = ref()
const { height } = useElementBounding(poi)

// 選択されたPOI
const selectedPois = ref([])

const handleSelectionChange = (val) => {
    selectedPois.value = val
    console.log(val)
}

const handleSortChange = ({ prop, order }) => {
    console.log(prop, order)
    sortProp.value = prop
    sortOrder.value = order
}

const handleMouseEnter = (row) => {
    cuesheetStore.setHighlight(row.id)
}

const handleMouseLeave = ()=>{
    // timeout 処理があるので特に何もしない
}

const onRowClick = (row) => {
    gmapStore.setCenter({lat:row.lat, lng:row.lng})
    gmapStore.setZoom(14)
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