<template>
    <div class="cuesheet">
        <el-radio-group v-if="startList.length" v-model="toolStore.currentBrmStart" size="small">
            <el-radio-button v-for="start of startList" :label="start.ts">{{ start.label }}</el-radio-button>
        </el-radio-group>
        <el-table :data="data" border style="height:100%" size="small" @row-click="onRowClick"
            :header-cell-style="headerCellStyle">
            <el-table-column prop="pointNo" label="No" fixed width="50" align="center" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="direction" label="進路" />
            <el-table-column prop="route" label="経路" />
            <el-table-column prop="lapDistance" label="区間" width="50" align="right" />
            <el-table-column prop="distance" label="距離" width="50" align="right" />
            <el-table-column prop="openLabel" label="オープン"/>
            <el-table-column prop="closeMin" label="クローズ"/>
            <el-table-column prop="note" label="備考" width="150"/>
        </el-table>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useToolStore } from '@/stores/ToolStore'
import { useGmapStore } from '@/stores/GmapStore'

const brmStore = useBrmRouteStore()
const cuesheetStore = useCuesheetStore()
const toolStore = useToolStore()
const gmapStore = useGmapStore()

const startList = computed(() => toolStore.startList)

const data = computed(()=>{
    const d = cuesheetStore.cuesheetData()
    console.log(d)
    return d
})

const onRowClick = (row: any) => {
    gmapStore.setCenter(row.routePoint)
}

const headerCellStyle = ({ columnIndex }: { columnIndex: number }) => {
    if (columnIndex === 5 || columnIndex === 6) {
        return { textAlign: 'center' }
    }
}
</script>

<style scoped>
.cuesheet {
    width: 100%;
    height: 100%;
}
</style>