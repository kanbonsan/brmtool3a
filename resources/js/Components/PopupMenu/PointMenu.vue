<template>
    <el-card class="route-point">
        <template #header>
            <div class="card-header">
                <span>ポイント</span>

                <el-icon :size="24">
                    <circle-close @click="onCancelClose"></circle-close>
                </el-icon>

            </div>
        </template>

        <el-row v-if="gmapStore.editMode || gmapStore.subpathMode">
            <el-tooltip placement="right" content="キューポイントを設置します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="success"
                    @click="onClick('addCuePoint')">キューポイント設置</el-button>
            </el-tooltip>
        </el-row>
        <el-row v-if="gmapStore.editMode">
            <el-tooltip placement="right" content="編集範囲設定スライダーを表示します" :auto-close="2000">
                <el-dropdown style="width:100%" @command="onChangeEditableRange">
                    <el-button :disabled="!gmapStore.editMode" class="menu-button" size="small"
                        type="primary">編集範囲設定</el-button>
                    <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="editFormer">前 を編集</el-dropdown-item>
                            <el-dropdown-item command="editLatter">後 を編集</el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>

            </el-tooltip>
        </el-row>
        <el-row v-if="gmapStore.editMode">
            <el-tooltip placement="right" content="サブパス選択を開始します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="primary"
                    @click="onClick('subpathBegin')">サブパス選択開始</el-button>
            </el-tooltip>
        </el-row>
        <el-row v-if="gmapStore.subpathSelectMode">
            <el-tooltip placement="right" content="この点をサブパスの終点にします" :auto-close="2000">
                <el-button class="menu-button" size="small" type="primary"
                    @click="onClick('subpathEnd')">サブパス範囲確定</el-button>
            </el-tooltip>
        </el-row>
        <el-row v-if="gmapStore.editMode || gmapStore.subpathMode">
            <el-tooltip placement="right" content="ストリートビューを移動します" :auto-close="2000">
                <el-button class="menu-button" size="small" type="danger"
                    @click="onClick('moveStreetview')">ストリートビュー</el-button>
            </el-tooltip>
        </el-row>

    </el-card>
</template>

<script setup lang="ts">
import { useGmapStore } from '@/stores/GmapStore'
import { onMounted } from 'vue'

const props = defineProps(['submit', 'menuParams'])
const gmapStore = useGmapStore()

const onClick = (result: string) => {
    props.submit({ status: 'success', result })
}

const onCancelClose = () => {
    props.submit({ status: 'success', result: 'cancel' })
}

const onChangeEditableRange = (cmd: string)=>{
    props.submit({status:'success', result: cmd})
}
</script>

<style scoped>
.route-point {
    width: 150px;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

:deep(.el-card__header) {
    --el-card-padding: 5px;
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    font-weight: bold;
}

:deep(.el-card__body) {
    padding: 5px;
}

.menu-button {
    width: 100%;
    margin-bottom: 4px;
}
</style>
