<template>
    <div class="drawer">
        <el-card style="height:100%;">
            <div style="position:absolute;top:5px;right:5px">
                <el-icon :size="32">
                    <circle-close></circle-close>
                </el-icon>
            </div>
            <slot></slot>
        </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


</script>

<style scoped>
.drawer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100px;
}
</style>