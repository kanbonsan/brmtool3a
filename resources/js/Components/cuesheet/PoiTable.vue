<template>
    <div ref="poi" class="cuesheet">
        <div class="header">
            POIリスト
        </div>
        <el-table :data="poiList" border style="height:100%" size="small" @row-click="onRowClick"
            :height="`calc( ${height}px - var(--header-height))`" :header-cell-style="headerCellStyle">
            <el-table-column prop="poiNo" label="No" fixed width="50" align="center" />
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="direction" label="進路" />
            <el-table-column prop="route" label="経路" />
            <el-table-column prop="lapDistance" label="区間" width="50" align="right" />
            <el-table-column prop="distance" label="距離" width="50" align="right" />
            <el-table-column prop="note" label="備考" width="150" />
        </el-table>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useElementBounding } from '@vueuse/core'

const cuesheetStore = useCuesheetStore()
const poiList = computed(() => cuesheetStore.poiData)

const poi = ref()
const { width, height } = useElementBounding(poi)

onMounted(() => {
    console.log(poiList.value)
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