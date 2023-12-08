<template>
    <el-row justify="space-between">
        <el-tooltip content="ルートポイントを一点づつ編集します" placement="bottom">
            <el-button type="primary" plain round @click="submitFunc('subpath:pathEdit')">編集</el-button>
        </el-tooltip>
        <el-tooltip content="選択範囲のルートポイントを削除します" placement="bottom">
            <el-button type="primary" plain round @click="submitFunc('subpath:delete')">削除</el-button>
        </el-tooltip>
        <el-tooltip content="Openroute Serviceでルート検索します" placement="bottom">
            <el-button type="primary" plain round @click="submitFunc('subpath:direction')">ルート</el-button>
        </el-tooltip>
        <el-tooltip content="選択範囲を除外区間に設定します" placement="bottom">
            <el-button type="primary" plain round @click="submitFunc('subpath:exclude')">除外範囲</el-button>
        </el-tooltip>
        <el-tooltip content="選択範囲の標高をフラットにします" placement="bottom">
        <el-button type="primary" plain round @click="submitFunc('subpath:flat')">トンネル</el-button>
        </el-tooltip>
    </el-row>
</template>

<script setup lang="ts">

const props = defineProps(['resetTimeout', 'submitFunc'])

</script>