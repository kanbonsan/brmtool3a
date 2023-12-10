<template>
    <div ref="profile" class="profile" style="position:relative;">
        <div v-if="!fullyEditable" class="buttons" style="position:absolute; top:5px; right:5px;z-index:2;">
            <el-button size="small" @click="toggleRange">{{ rangeButtonText }}</el-button>
        </div>
        <Graph style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Graph>
        <Axis style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Axis>
        <Marker style="position:absolute;left:0;top:0;" :key="redrawKey" :width="width" :height="height"></Marker>

    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useProfileStore } from '@/stores/ProfileStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useElementBounding, useMouseInElement } from '@vueuse/core'


import Axis from '@/Components/profile/Axis.vue'
import Graph from './profile/Graph.vue'
import Marker from './profile/GraphMarker.vue'
import Console from './profile/GraphConsole.vue'

const profileStore = useProfileStore()
const brmStore = useBrmRouteStore()

const profile = ref()
const redrawKey = ref(Symbol())

const { width, height } = useElementBounding(profile)

const fullyEditable = computed(() => brmStore.fullyEditable)
const fullRange = ref(true)
const rangeButtonText = computed(() => fullRange.value ? "選択範囲" : "全範囲")
const toggleRange = () => {
    const [edBegin, edEnd] = brmStore.editableIndex
    const { begin, end } = brmStore.brmRange

    if (!edBegin || !edEnd) return
    if (fullRange.value === true) {
        profileStore.setProfileDistance({ begin: edBegin, end: edEnd })
    } else {
        profileStore.setProfileDistance({ begin, end })
    }
    fullRange.value = !fullRange.value
}

// Paneのサイズが変わったとき
watch([width, height], ([width, height]) => {
    profileStore.width = width
    profileStore.height = height
    redrawKey.value = Symbol()
}, { immediate: true })

// ルートが変わったとき
watch([() => brmStore.brmDistance, () => brmStore.brmHighestAltitude], ([distance, altitude]) => {
    profileStore.$patch((state) => {
        state.distance.end = distance
        state.altitude.high = altitude
    })
    redrawKey.value = Symbol()
})

// 編集範囲が変わったとき
watch(() => brmStore.editableIndex, (index) => {
    if ((!index[0]) || (!index[1])) return

    if (fullyEditable.value === true) { // 全範囲選択
        fullRange.value = true
    } else {
        profileStore.setProfileDistance({ begin: index[0], end: index[1] })
        fullRange.value = false
    }
})

watch(() => profileStore.profile, () => {
    redrawKey.value = Symbol()
})

</script>

<style scoped>
.profile {
    width: 100%;
    height: 100%;
}
</style>