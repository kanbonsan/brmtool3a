<template>
    <el-row>
        {{ ctrlPts }}個のマーカーを検索したいルート上に置いてください. Openroute ServiceのAPIでルート探索します.
    </el-row>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onSubmit">編集確定</el-button>
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

const ctrlPts = ref( DirectionReference )

const onSubmit = () => {
    ElMessageBox.confirm(
        'パスの編集を確定させます.',
        '編集確定',
        {
            confirmButtonText: 'OK',
            cancelButtonText: 'キャンセル',
            type: 'warning'
        }
    ).then(() => {
        props.submitFunc('subpath:editPathConfirm')
    }).catch(() => {
        ElMessage({ type: 'info', message: '取り消しました.' })
    })
}

const onCancel = () => {
    props.submitFunc('subpathRange:submit')
}

</script>