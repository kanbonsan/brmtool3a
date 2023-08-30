<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>キューポイント #{{ cuePoint.pointNo }}</span>

                <el-icon :size="24">
                    <circle-close @click="onCancelClose"></circle-close>
                </el-icon>

            </div>
        </template>
        <el-form label-width="50px" size="small" :model="form" @input="synchronize">
            <el-radio-group v-model="form.type">
                <el-radio-button label="Point" />
                <el-radio-button label="PC" />
                <el-radio-button label="Check" />
                <el-radio-button label="POI" />
            </el-radio-group>
            <el-form-item label="名称">
                <el-row>
                    <el-col :span="4">
                        <el-select v-model="form.signal">
                            <el-option v-for="item in signals" :key="item.label" :label="item.label"
                                :value="item.value"></el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="4">
                        <el-select v-model="form.crossing">
                            <el-option v-for="item in crossings" :key="item.label" :label="item.label" :value="item.value"></el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="16">
                        <el-input v-model="form.name"></el-input>
                    </el-col>
                </el-row>
            </el-form-item>
            <el-form-item label="進路">
                <el-input v-model="form.direction"></el-input>
            </el-form-item>
            <el-form-item label="道路">
                <el-input v-model="form.route"></el-input>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'

const props = defineProps(['submit', 'menuParams'])
const cuesheetStore = useCuesheetStore()

const cuePoint = props.menuParams.cuePoint
const form = reactive({ type: cuePoint.type, ...props.menuParams.cuePoint.properties })

const signals = [{ value:false, label: ' ' },{ value: true, label: 'S' }, ]
const crossings = ['a','b','c'].map(chr=>({ value: chr, label: chr}))

const onClick = (result: boolean) => {
    props.submit({ status: 'success', result })
}

const onCancelClose = () => {
    props.submit({ status: 'success', result: 'cancel' })
}
const synchronize = () => {
    cuesheetStore.synchronize(props.menuParams.cuePoint.id, form)
}

</script>

<style scoped>
.cue-point {
    width: 400px;
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
</style>
