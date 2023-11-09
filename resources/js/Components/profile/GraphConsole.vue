<template>
    <div class="console">
        <table>
            <tr>
                <th>zoom</th>
                <td>{{ zoom }}</td>
            </tr>
            <tr v-for="item of list">
                <th>{{ item.weight }}</th>
                <td>{{ item.count }}</td>
            </tr>
        </table>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useProfileStore } from '@/stores/ProfileStore';
import { useBrmRouteStore } from '@/stores/BrmRouteStore';
import { useGmapStore } from '@/stores/GmapStore';

const brmStore = useBrmRouteStore()
const gmapStore = useGmapStore()
const list = computed(()=>brmStore.weightList)

const zoom = computed(()=>gmapStore.zoom)

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