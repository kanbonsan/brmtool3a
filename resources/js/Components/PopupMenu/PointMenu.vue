<template>
    <el-card class="ex-poly" style="width:200px;padding:0;">
        <template #header>
            <h4>ポイント</h4>
        </template>

        <el-row>
            <el-tooltip content="編集範囲の設定をします">
                
                    <el-button class="menu-button" size="small" type="info">編集範囲を設定</el-button>
                
            </el-tooltip>
        </el-row><el-row>
            <el-button class="menu-button" size="small" type="info">ボタン１</el-button>
        </el-row>
        <el-button text>ボタン２</el-button>
        <el-row>
            <el-button @click="onClick('addCuePoint')">キューポイントを設定</el-button>
        </el-row>
        <el-row>
            <el-button @click="onClick('cancel')">キャンセル</el-button>
        </el-row>
    </el-card>
</template>

<script setup lang="ts">

const props = defineProps(['submit', 'params'])

const onClick = (result: string) => {
    switch (result) {
        case 'addCuePoint':
            break
        case 'cancel':
            break
    }
    props.submit({ status: 'success', result })
}

</script>

<style scoped>
.menu-button {
    width: 200px;
    margin-bottom: 2px;
}
</style>
