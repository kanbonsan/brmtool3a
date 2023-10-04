<template>
    <div class="console">
        <table>
            <tr>
                <th>width</th><td>{{ width }}</td>
            </tr>
            <tr>
                <th>height</th><td>{{ height }}</td>
            </tr>
            <tr>
                <th>graph</th><td>wd:{{ graphSize.width }}, ht:{{ graphSize.height }}</td>
            </tr>
            <tr>
                <th>scale</th><td>X:{{ graphScale.xAxis }}m, Y:{{ graphScale.yAxis }}m</td>
            </tr>
            <tr>
                <th>distance</th><td>{{ distance.begin }}～{{ distance.end }}</td>
            </tr>
            <tr>
                <th>altitude</th><td>{{ alt.low }}～{{ alt.high }}</td>
            </tr>
            <tr>
                <th>origin</th><td>X: {{ origin.xOrig }}, Y: {{ origin.yOrig }}</td>
            </tr>
        </table>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProfileStore } from '@/stores/ProfileStore';

const store = useProfileStore()
const width = computed(()=>store.width)
const height = computed(()=>store.height)
const graphSize = computed(()=>store.graphSize)
const graphScale = computed(()=>store.graphScale)
const distance = computed(()=>store.distance)
const alt = computed(()=>store.altitude)
const origin = computed(()=>store.graphOrigin)

</script>


<style scoped>
.console {
    position: absolute;
    right: 0;
    text-transform: none;
    width: 300px;
    height: 100%;
    z-index: 100;
}
</style>