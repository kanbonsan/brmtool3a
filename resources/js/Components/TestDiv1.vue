<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>ポイント移動</span>

                <el-icon :size="24">
                    <circle-close></circle-close>
                </el-icon>
            </div>
        </template>
        <el-row>キューポイントをこの地点に移動しますか?</el-row>
        <el-row>
            <el-button size="small">はい</el-button><el-button size="small">いいえ</el-button>
        </el-row>

    </el-card>
    <el-card class="cue-point" style="width:400px">
        <template #header>
            <div class="card-header">
                <span>キューポイント #</span>

                <el-icon :size="24">
                    <circle-close></circle-close>
                </el-icon>

            </div>
        </template>
        <el-form label-width="50px" size="small" :model="form">
            <el-radio-group v-model="form.type">
                <el-radio-button label="Point">
                    <span style="display: inline-block;width:100px">ポイント</span>
                </el-radio-button>
                <el-radio-button label="PC" />
                <el-radio-button label="Check" />
                <el-radio-button label="POI" />
            </el-radio-group>
            <el-form-item class="my-item">
                <template #label>
                    <div style="align-self: center;">
                        名称
                    </div>
                </template>
                <div>
                    <el-row>
                        <el-col :span="4" class="desc">
                            信号</el-col>
                        <el-col :span="4" class="desc">
                            交差点</el-col>
                        <el-col :span="16" class="desc">
                            名称</el-col>
                    </el-row>
                    <el-row>
                        <el-col :span="4">
                            <el-select v-model="form.signal">
                                <el-option v-for="item in signals" :key="item.label" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="4">
                            <el-select v-model="form.crossing">
                                <el-option v-for="item in crossings" :key="item.label" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="16">
                            <el-input v-model="form.name"></el-input>
                        </el-col>
                    </el-row>
                </div>
            </el-form-item>
            <el-row>
                <el-col :span="12"><el-form-item label="進路">
                        <el-input v-model="form.direction"></el-input>
                    </el-form-item></el-col>
                <el-col :span="12"><el-form-item label="道路">
                        <el-input v-model="form.route"></el-input>
                    </el-form-item></el-col>
            </el-row>


        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
const props = defineProps(['submit'])

const form = reactive({
    signal: false,
    crossing: '',
    name: '',
    direction: '',
    road: ''
})
const signals = [{ value: false, label: ' ' }, { value: true, label: 'S' },]
const crossings = ["├", "┤", "┼", "┬", "Ｙ"].map(chr => ({ value: chr, label: chr }))
crossings.unshift({ label: '　', value: ' ' })

const onClick = () => {

    props.submit('Test Div 1')
}

</script>

<style scoped>
.cue-point {
    width: 120px;
}

:deep(.el-card__header) {
    --el-card-padding: 5px;
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    font-weight: bold;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.my-item :deep(.el-form-item__label) {
    align-self: center;
}

.desc {
    font-size: x-small
}
</style>
