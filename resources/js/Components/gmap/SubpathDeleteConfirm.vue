<template>
    <el-row>
        サブパスの範囲のポイントを削除します. ルートから外れたキューポイントを削除するかPOIで残すか選択できます.
    </el-row>
    <el-checkbox v-model="deletePoi" label="キューポイントを削除する"></el-checkbox>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onSubmit">削除</el-button>
    </el-row>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'

const props = defineProps(['resetTimeout', 'submitFunc'])
const routeStore = useBrmRouteStore()

// 遊離キューポイントをPOI化せずに削除するか
const deletePoi = ref(false)

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
        props.submitFunc('subpath:deleteConfirm', { deletePoi: deletePoi.value })
    }).catch(() => {
        ElMessage({ type: 'info', message: '取り消しました.' })
    })
}

const onCancel = () => {
    routeStore.subpathTempPathTouched = false
    props.submitFunc('subpathRange:submit')
}

</script>