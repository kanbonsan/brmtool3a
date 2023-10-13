<template>
    <el-card class="brm-file-download">
        BRMファイルをダウンロードします.
        <el-form v-model="form">
            <el-form-item label="ファイル形式">
                <el-radio-group>
                    <el-radio></el-radio>
                    <el-radio></el-radio>
                </el-radio-group>
            </el-form-item>

        </el-form>
        <el-button @click="a">OK</el-button>
    </el-card>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue"
import fileDownload from "js-file-download"

const props = defineProps(['onClose'])
const form = reactive<{
    version: 3 | 1,
    compress: boolean
}>({
    version: 3,
    compress: true
})

const version = ref<3 | 1>(3) // 保存バージョン
const compress = ref<boolean>(true) // 圧縮するか

</script>

<style scoped></style>