<template>
    <div ref="cuesheet" class="cuesheet">
        <div class="header">
            <el-radio-group v-if="startList.length" v-model="currentBrmStart" size="small" @change="console.log('changed')">
                <el-radio-button v-for="start of startList" :label="start.ts">{{ start.label }}</el-radio-button>
            </el-radio-group>
        </div>
        <el-table :data="data" border style="height:100%" size="small" @row-click="onRowClick"
            :height="`calc( ${height}px - var(--header-height))`" :header-cell-style="headerCellStyle">
            <el-table-column prop="pointNo" label="No" fixed width="50" align="center" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="direction" label="進路" />
            <el-table-column prop="route" label="経路" />
            <el-table-column prop="lapDistance" label="区間" width="50" align="right" />
            <el-table-column prop="distance" label="距離" width="50" align="right" />
            <el-table-column prop="openLabel" label="オープン" />
            <el-table-column prop="closeLabel" label="クローズ" />
            <el-table-column prop="note" label="備考" width="150" />
        </el-table>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useToolStore } from '@/stores/ToolStore'
import { useGmapStore } from '@/stores/GmapStore'
import { useElementBounding } from '@vueuse/core'

const cuesheetStore = useCuesheetStore()
const toolStore = useToolStore()
const gmapStore = useGmapStore()

const cuesheet = ref()
const { width, height } = useElementBounding(cuesheet)

const currentBrmStart = computed(
    {
        get() {
            return toolStore.brmInfo.currentStartTime
        },
        set(newTs) {
            toolStore.brmInfo.currentStartTime = newTs
        }
    })

const startList = computed(() => toolStore.startList)

const data = computed(() => {
    const d = cuesheetStore.cuesheetData(currentBrmStart.value)
    return d
})

const onRowClick = (row: any) => {
    gmapStore.setCenter(row.routePoint)
    gmapStore.setZoom(14)
    gmapStore.moveStreetViewByPoint(row.routePoint)
}

const headerCellStyle = ({ columnIndex }: { columnIndex: number }) => {
    if (columnIndex === 5 || columnIndex === 6) {
        return { textAlign: 'center' }
    }
}

const setCurrentStartTime = () => {
    if (!toolStore.brmInfo.currentStartTime) {
        toolStore.brmInfo.currentStartTime = toolStore.brmInfo.startTime.length > 0 ? toolStore.brmInfo.startTime[0] : undefined
    }
}

onMounted(() => {
    setCurrentStartTime()
})

// currentStartTime に設定されていたスタート時間が消去されれば、いったんcurrentStartTimeをundefinedとして、あらたにデフォルト時刻を設定する
watch(() => toolStore.brmInfo.startTime, () => {
    if (toolStore.brmInfo.currentStartTime && !toolStore.brmInfo.startTime.includes(toolStore.brmInfo.currentStartTime)) {
        toolStore.brmInfo.currentStartTime = undefined
    }
    setCurrentStartTime()
})

</script>


<style scoped>
.cuesheet {
    --header-height: 40px;
    width: 100%;
    height: 100%;
}

.header {
    height: var(--header-height);
}
</style>