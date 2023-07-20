<template>
    <el-card class="ex-poly" style="width:200px;padding:0;">
        <template #header>
            <h4>ポイント</h4>
        </template>

        <el-row>
            <el-tooltip placement="right" content="編集範囲設定スライダーを表示します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="info"
                @click="onClick('editableRange')">編集範囲設定</el-button>
            </el-tooltip>
        </el-row>
        <el-row>
            <el-tooltip placement="right" content="サブパス編集モードに入ります">
                <el-button class="menu-button" size="small" type="info">サブパスモード</el-button>
            </el-tooltip>
        </el-row>
        <el-row>
            <el-tooltip placement="right" content="キューポイントを設定します">
                <el-button class="menu-button" size="small" type="info"
                    @click="onClick('addCuePoint')">キューポイント設定</el-button>
            </el-tooltip>
        </el-row>
        <el-row>
            <el-tooltip placement="right" content="このポイントを削除します">
                <el-button class="menu-button" size="small" type="info">ポイント削除</el-button>
            </el-tooltip>
        </el-row>
        <el-row>

            <el-button class="menu-button" size="small" type="info" @click="onClick('cancel')">キャンセル</el-button>

        </el-row>

    </el-card>
</template>

<script setup lang="ts">

const props = defineProps(['submit', 'params'])

const onClick = (result: string) => {
    switch (result) {
        case 'addCuePoint':
            break
        case 'editableRange':
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
