<template>
    <div class="drawer">
        <el-card style="height:100%;" :title="title">
            <template #header>{{ title }}
                <div style="position:absolute;top:5px;right:5px">
                    <el-icon :size="32" @click="closeDrawer">
                        <circle-close></circle-close>
                    </el-icon>
                </div>
            </template>
            <slot></slot>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
interface Props {
    title: string
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const closeDrawer = ()=>{
    emit('close')
}

</script>

<style scoped>
.drawer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100px;
}
</style>