<template>
    <el-row>
        サブパスに対するコマンドを指定してください
    </el-row>
    <el-row justify="center">
        <el-button @click="submitFunc('subpath:delete')">削除</el-button>
        <el-button @click="submitFunc('subpath:pathEdit')">編集</el-button>
        <el-button @click="submitFunc('subpath:direction')">ルート</el-button>
        <el-button @click="submitFunc('subpath:exclude')">除外範囲</el-button>
        <el-button @click="submitFunc('subpath:flat')">トンネル</el-button>
    </el-row>
    <el-row justify="end"><el-button @click="submitFunc('ReturnToEdit')">キャンセル</el-button></el-row>
</template>

<script setup lang="ts">

const props = defineProps(['resetTimeout', 'submitFunc'])

</script>