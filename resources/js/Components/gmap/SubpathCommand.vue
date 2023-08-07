<template>
    <el-row>
        サブパスに対するコマンドを指定してください
    </el-row>
    <el-row justify="center">
        <el-button @click="onDelete">削除</el-button>
        <el-button @click="onEdit">編集</el-button>
        <el-button @click="onDirection">ルート</el-button>
        <el-button @click="onExclude">除外範囲</el-button>
        <el-button @click="submitFunc('subpath:flat')">トンネル</el-button>
    </el-row>
    <el-row justify="end"><el-button @click="submitFunc('subpath:cancel')">キャンセル</el-button></el-row>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useToolStore } from '@/stores/ToolStore'

const routeStore = useBrmRouteStore()
const toolStore = useToolStore()
const props = defineProps(['resetTimeout', 'submitFunc'])

const onDelete = () => {
    ElMessageBox.confirm(
        'サブパス範囲内のポイントを消去します. サブパス上のキューポイントはPOIになります.',
        'ポイント削除',
        {
            confirmButtonText: 'OK',
            cancelButtonText: 'キャンセル',
            type: 'warning'
        }
    ).then(() => {
        props.submitFunc('subpath:delete')
    }).catch(() => {
        ElMessage({ type: 'info', message: '取り消しました.' })
    })
}

const onEdit = () => {
    props.submitFunc('subpath:pathEdit')
}

const onExclude = () => {
    props.submitFunc('subpath:exclude')
}

const onDirection = ()=>{
    props.submitFunc('subpath:direction')
}

</script>