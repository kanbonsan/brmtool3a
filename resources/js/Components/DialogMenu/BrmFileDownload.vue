<template>
    <el-card class="brm-file-download">
        BRMファイルをダウンロードします. 
        <el-form>

        </el-form>
        <el-button @click="a">OK</el-button>
    </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import fileDownload from "js-file-download"

const props = defineProps(['onClose'])

const version = ref<3|1>(3) // 保存バージョン
const compress = ref<boolean>(true) // 圧縮するか
const a = props.onClose
</script>

<style scoped>

</style>