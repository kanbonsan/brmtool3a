<template>
    <el-row>
        サブパスの範囲の標高をフラットにします.
    </el-row>
    <el-row justify="end">
        <el-button @click="onCancel">キャンセル</el-button>
        <el-button @click="onSubmit">OK</el-button>
    </el-row>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

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
        props.submitFunc('subpath:flatConfirm')
    }).catch(() => {
        ElMessage({ type: 'info', message: '取り消しました.' })
    })
}

const onCancel = () => {
    props.submitFunc('subpathRange:submit')
}

</script>