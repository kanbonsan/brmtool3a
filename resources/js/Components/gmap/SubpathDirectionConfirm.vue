<template>
    <el-row>
        このルートで置き換えますか
    </el-row>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onReturn">戻る</el-button>
        <el-button @click="onSubmit">編集確定</el-button>
    </el-row>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useToolStore } from '@/stores/ToolStore'

const routeStore = useBrmRouteStore()
const toolStore = useToolStore()
const props = defineProps(['resetTimeout', 'submitFunc'])

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
    // サブパスコマンド入力へ
    props.submitFunc('subpathRange:submit')
}

const onReturn = () => {
    // 経由ポイント設定へ
    props.submitFunc('subpath:direction')
}

</script>