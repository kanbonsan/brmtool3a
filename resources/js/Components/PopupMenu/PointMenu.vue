<template>
    <el-card class="ex-poly" style="padding:0;">
        <template #header>
            <h4>ポイント</h4>
        </template>
        <el-row>
            <el-tooltip :disabled="true" placement="right" content="キューポイントを設定します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="info"
                    @click="onClick('addCuePoint')">キューポイント設定</el-button>
            </el-tooltip>
        </el-row>
        <el-row>
            <el-tooltip placement="right" content="編集範囲設定スライダーを表示します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="info" @click="onClick('editableRange')">編集範囲設定</el-button>
            </el-tooltip>
        </el-row>
        <el-row>
            <el-tooltip placement="right" content="サブパス選択を開始します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="info"
                    @click="onClick('subpathBegin')">サブパス選択開始</el-button>
            </el-tooltip>
        </el-row>
        <el-row>
            <el-tooltip placement="right" content="この点をサブパスの終点にします" :auto-close="2000">
                <el-button class="menu-button" size="small" type="info" @click="onClick('subpathEnd')">サブパス範囲確定</el-button>
            </el-tooltip>
        </el-row>

        <el-row>
            <el-tooltip placement="right" content="このポイントを削除します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="info">ポイント削除</el-button>
            </el-tooltip>
        </el-row>
        <el-row>

            <el-button class="menu-button" size="small" type="info" @click="onClick('cancel')">キャンセル</el-button>

        </el-row>

    </el-card>
</template>

<script setup lang="ts">
import { inject } from 'vue'
const props = defineProps(['submit', 'params'])
const mode = inject('mode')

const onClick = (result: string) => {
    props.submit({ status: 'success', result })
}

</script>

<style scoped>
:deep(.el-card__body) {
    --el-card-padding: 2px;
}

.menu-button {
    width: 150px;
    margin-bottom: 2px;
}
</style>
