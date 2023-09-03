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
                <div style="width:100%;">
                    <el-row>
                        <el-col :span="cuePoint.type === 'cue' ? 4 : 0" class="desc">
                            信号</el-col>
                        <el-col :span="cuePoint.type === 'cue' ? 4 : 0" class="desc">
                            交差点</el-col>
                        <el-col :span="cuePoint.type === 'cue' ? 16 : 24" class="desc">
                            名称</el-col>
                    </el-row>
                    <el-row>
                        <el-col :span="cuePoint.type === 'cue' ? 4 : 0">
                            <el-select v-model="form.signal" @change="synchronize">
                                <el-option v-for="item in signals" :key="item.label" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="cuePoint.type === 'cue' ? 4 : 0">
                            <el-select v-model="form.crossing" @change="synchronize">
                                <el-option v-for="item in crossings" :key="item.label" :label="item.label"
                                    :value="item.value"></el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="cuePoint.type === 'cue' ? 16 : 24">
                            <el-autocomplete v-model="form.name" :fetch-suggestions="nameSearch" clearable
                                @select="synchronize" style="width:100%;"></el-autocomplete>
                        </el-col>
                    </el-row>
                </div>
            </el-form-item>
            <el-row>
                <el-col :span="8"><el-form-item label="進路">
                        <el-autocomplete v-model="form.direction" :fetch-suggestions="directionSearch" clearable
                            @select="synchronize" @change="synchronize"></el-autocomplete>
                    </el-form-item></el-col>
                <el-col :span="16"><el-form-item label="道路">
                        <el-autocomplete v-model="form.route" :fetch-suggestions="roadSearch" clearable></el-autocomplete>
                    </el-form-item></el-col>
            </el-row>


        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useGeocodeStore } from '@/stores/GeocodeStore'
import { CuePoint } from '@/classes/cuePoint'
import { valueEquals } from 'element-plus'

const props = defineProps(['submit', 'menuParams'])
const cuesheetStore = useCuesheetStore()
const routeStore = useBrmRouteStore()
const geocodeStore = useGeocodeStore()

const directions: [number, number, string, string?][] = [
    [0, 15, '直進', 'S'],
    [75, 105, '右折', 'R'],
    [165, 195, '戻る', ''],
    [255, 285, '左折', 'L'],
    [345, 360, '直進', 'S'],
    [0, 45, 'まっすぐ', 'S'],
    [45, 165, '右', 'R'],
    [195, 315, '左', 'L'],
    [315, 360, 'まっすぐ', 'S'],
    [0, 180, '右', 'R'],
    [180, 360, '左', 'L'],
]



const cuePoint = props.menuParams.cuePoint as CuePoint
const routePoint = routeStore.getPointById(cuePoint.routePointId)

const form = reactive({ type: cuePoint.type, ...props.menuParams.cuePoint.properties })

onMounted(() => {

    // 進路の初期設定
    if (cuePoint.type !== 'poi' && form.direction === '') {
        const dirs = Array.from(getDirection())
        form.direction = dirs[0]
    }
})

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

    if (cuePoint.type === 'poi') {
        cb([])
        return
    }

    const res = await geocodeStore.getData('placeInfo', routePoint?.lat!, routePoint?.lng!)

    if (cuePoint.type === 'pc' || cuePoint.type === 'pass') {
        cb(res.data.control.map((item: string) => ({ value: item })))
    } else {
        cb(res.data.crossing.map((item: string) => ({ value: item })))
    }
}

const getRoads = async () => {

    const roads: Set<string> = new Set()
    const seek = [0, 300, 1000, 5000, 10000]

    for (const distance of seek) {
        const loc = routeStore.getLocationByDistance(routePoint?.routeDistance! + distance)
        const res = await geocodeStore.getData('reverseGeocoder', loc.lat, loc.lng)
        res.data.road.forEach((rd: any) => roads.add(rd.Kigou))
    }

    roads.add('市道')

    return Array.from(roads)
}


const roadSearch = async (queryString: string, cb: any) => {
    // 現在の入力内容を整形
    const current = queryString.replace(/[ 　]+/, ' ').split('→').map(item => item.trim()).filter(item => item !== '')
    const roadList = await getRoads()

    const suggestions = []

    if (current.length > 0) {
        suggestions.push(current)
        suggestions.push([...current, ""]) // 「→」のみ
        for (let i: number = 0; i < 3; i++) {
            const road = roadList[i]
            if (roadList[i] && !current.includes(road)) {
                suggestions.push([...current, road])
            }
        }
    }

    for (let i: number = 0; i < 2; i++) {
        const road = roadList[i]
        let exist = false
        for (const suggestion of suggestions) {
            if (suggestion.length === 1 && suggestion.includes(road)) {
                exist = true
            }
        }
        if (!exist) {
            suggestions.push([road])
        }
    }

    cb(suggestions.map((s) => ({ value: s.join(' → ') })))

}

// 進路
const getDirection = () => {
    const list = new Set()

    // 参照点前後 50m、100m を元にしたときの進路（度）
    const headings = [routeStore.getHeading(routePoint, 50).heading, routeStore.getHeading(routePoint, 100).heading]

    for (const i of [0, 1, 2]) {  // ただのループ
        for (const heading of headings) {
            for (const item of directions) {
                if (item[0] <= heading && heading < item[1] && !list.has(item[2])) {
                    list.add(item[2])
                    break
                }
            }
        }
    }
    // 残りをリストに加える
    for (const item of directions) {
        list.add(item[2])
    }
    return list
}

const directionSearch = async (queryString: string, cb: any) => {
    if (cuePoint.type === 'poi') {
        return cb([])
    } else {
        const dirList = Array.from(getDirection()).map(item => ({ value: item }))
        cb(dirList)
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

:deep(.el-form-item__label) {
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
