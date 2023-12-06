<template>
    <el-row>
        サブパスのポイントを手動で編集します。キューポイントは分離されてPOIになることがあります。
    </el-row>
    <el-checkbox v-model="deletePoi" label="POI化せずにキューポイントを削除する"></el-checkbox>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onSubmit" :disabled="!touched">編集確定</el-button>
    </el-row>
</template>

<script setup lang="ts">
import { computed,ref} from "vue"
import { ElMessage, ElMessageBox } from 'element-plus'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'

const props = defineProps(['resetTimeout', 'submitFunc'])
const routeStore = useBrmRouteStore()

// 編集されたか
const touched = computed(() => routeStore.subpathTempPathTouched)

// 遊離キューポイントをPOI化せずに削除するか
const deletePoi = ref(true)

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