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
        <el-form label-width="40px" size="small" :model="form" @input="synchronize">
            <el-radio-group v-model="form.type" @change="synchronize">
                <el-radio label="cue">ポイント</el-radio>
                <el-radio label="pc">PC</el-radio>
                <el-radio label="pass">チェック</el-radio>
                <el-radio label="poi">POI</el-radio>
            </el-radio-group>
            <el-form-item class="my-form-item" label="名称">
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
                            <el-select v-model="form.signal" @change="synchronize">
                                <el-option v-for="item in signals" :key="item.label" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="4">
                            <el-select v-model="form.crossing" @change="synchronize">
                                <el-option v-for="item in crossings" :key="item.label" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="16">
                            <el-autocomplete v-model="form.name" :fetch-suggestions="nameSearch" clearable
                                style="width:100%;"></el-autocomplete>
                        </el-col>
                    </el-row>
                </div>
            </el-form-item>
            <el-row>
                <el-col :span="8"><el-form-item label="進路">
                        <el-input v-model="form.direction"></el-input>
                    </el-form-item></el-col>
                <el-col :span="16"><el-form-item label="道路">
                        <el-input v-model="form.route"></el-input>
                    </el-form-item></el-col>
            </el-row>


        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore';
import { useGeocodeStore } from '@/stores/GeocodeStore';
import { CuePoint } from '@/classes/cuePoint';

const props = defineProps(['submit', 'menuParams'])
const cuesheetStore = useCuesheetStore()
const routeStore = useBrmRouteStore()
const geocodeStore = useGeocodeStore()

const cuePoint = props.menuParams.cuePoint as CuePoint
const form = reactive({ type: cuePoint.type, ...props.menuParams.cuePoint.properties })

// select の選択肢
const signals = [{ value: false, label: ' ' }, { value: true, label: 'S' },]
const crossings = ["├", "┤", "┼", "┬", "Ｙ"].map(chr => ({ value: chr, label: chr }))
crossings.unshift({ label: '　', value: '' })

const onClick = (result: boolean) => {
    props.submit({ status: 'success', result })
}

const onCancelClose = () => {
    props.submit({ status: 'success', result: 'cancel' })
}
const synchronize = () => {
    const cueType = form.type
    cuesheetStore.synchronize(props.menuParams.cuePoint.id, form, cueType)
}

const nameSearch = async (queryString: string, cb: any) => {

    if( cuePoint.type === 'poi'){
        cb([])
        return
    }

    const pt = routeStore.getPointById( cuePoint.routePointId)

    const res = await geocodeStore.getData('placeInfo', pt?.lat!, pt?.lng! )
    
    if( cuePoint.type === 'pc' || cuePoint.type==='pass'){
        cb( res.data.control.map((item: string)=>({value: item})))
    } else {
        cb( res.data.crossing.map((item: string)=>({value: item})))
    }
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

:deep(.el-form-item__label){
    padding-right: 5px;
    /* color: black; */
    font-weight: bold;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.desc {
    font-size: x-small;
    color: black;
    line-height: 12px;
}

.my-form-item :deep(.el-form-item__label) {
    align-self: self-end;
}

.my-form-item :deep(.el-form-item--small) {
    line-height: 16px;
}
</style>
