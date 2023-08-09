<template>
    <el-row style="text-transform: capitalize;">
        検索したいルートの通過点を設定してください. Openroute ServiceのAPIでルート探索します.
    </el-row>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onSubmit">ルート検索</el-button>
    </el-row>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useToolStore } from '@/stores/ToolStore'
import { DirectionReference } from "@/config"

const routeStore = useBrmRouteStore()
const toolStore = useToolStore()
const props = defineProps(['resetTimeout', 'submitFunc'])

const onSubmit = () => {
    props.submitFunc('subpath:directionQuery')
}

const onCancel = () => {
    props.submitFunc('subpathRange:submit')
}

</script>