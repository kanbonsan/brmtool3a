<template>
    <el-row>
        サブパスのポイントを手動で編集します。キューポイントが設定されているポイントを編集した場合、キューポイントは一旦POIとしてキューシートから分離されます。
    </el-row>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onSubmit" :disabled="!touched">編集確定</el-button>
    </el-row>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'

const props = defineProps(['resetTimeout', 'submitFunc'])
const routeStore = useBrmRouteStore()
const touched = computed(() => routeStore.subpathTempPathTouched)

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
    routeStore.subpathTempPathTouched = false
    props.submitFunc('subpathRange:submit')
}

</script>