<template>
    <el-card class="cue-point">
        <template #header>
            <div class="card-header">
                <span>{{ pointTitle }}</span>

                <el-icon :size="24">
                    <circle-close @click="onCancelClose"></circle-close>
                </el-icon>

            </div>
        </template>
        <el-form label-width="50px" size="small" :model="form" @input="synchronize">
            <el-row>
                <el-col :span="cuePoint.type === 'pc' && !cuePoint.terminal ? 20 : 24" class="desc">ポイントタイプ</el-col>
                <el-col :span="cuePoint.type === 'pc' && !cuePoint.terminal ? 3 : 0" :offset="1" class="desc">グループ</el-col>
            </el-row>
            <el-row style="margin-bottom: 10px;">
                <el-col :span="cuePoint.type === 'pc' && !cuePoint.terminal ? 20 : 24">
                    <el-radio-group v-model="form.type" class="cue-type" @change="synchronize">
                        <el-radio :disabled="cuePoint.terminal" label="cue" border>ポイント</el-radio>
                        <el-radio label="pc" border>PC</el-radio>
                        <el-radio :disabled="cuePoint.terminal" label="pass" border>チェック</el-radio>
                        <el-radio :disabled="cuePoint.terminal" label="poi" border>POI</el-radio>
                    </el-radio-group>
                </el-col>
                <el-col :span="cuePoint.type === 'pc' && !cuePoint.terminal ? 3 : 0" :offset="1">
                    <el-tooltip placement="right" content="前後のPCとグループ設定します">

                        <el-button v-if="cuePoint.groupId === undefined" style="align-self:flex-end;"
                            :disabled="!groupAvailable" @click="groupConfirm">{{
                                form.pcGroup ? '解除' : '設定' }}</el-button>
                        <el-button v-else @click="groupConfirm">共有</el-button>
                    </el-tooltip>
                </el-col>

            </el-row>
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
                                @select="synchronize" @change="synchronize" style="width:100%;"></el-autocomplete>
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
                        <el-autocomplete v-model="form.route" :fetch-suggestions="roadSearch" clearable style="width:100%;"
                            @select="synchronize" @change="synchronize"></el-autocomplete>
                    </el-form-item></el-col>
            </el-row>
            <el-form-item>
                <template #label>
                    <div style="display:inline-flex; flex-flow:column; align-items: flex-end;">
                        <img :src="garmin" style="width:100%;"><span>GPS</span>
                    </div>
                </template>
                <div style="width:100%">
                    <el-row>
                        <el-col :span="8" :offset="2" class="desc">
                            アイコン</el-col>
                        <el-col :span="9" :offset="1" class="desc">
                            ラベル</el-col>
                        <el-col :span="3" :offset="1" class="desc">
                            <el-tooltip placement="right" content="デバイスへの表示">表示</el-tooltip></el-col>
                    </el-row>
                    <el-row>
                        <el-col :span="2">
                            <img v-if="form.garminDeviceIcon !== ''" :src="garminIcons[form.garminDeviceIcon].dataUrl"
                                style="height:26px;" />
                        </el-col>
                        <el-col :span="8">
                            <el-select v-model="form.garminDeviceIcon" @change="synchronize">
                                <el-option v-for="icon in garminIcons" :key="icon.enName" :label="icon.jaName"
                                    :value="icon.enName">
                                    <div style="display:inline-flex"><img :src="icon.dataUrl" /><span class="px-2">{{
                                        icon.jaName }}</span></div>
                                </el-option>
                            </el-select>
                        </el-col>
                        <el-col :span="4" :offset="1"><el-input v-model="form.garminDeviceText" @change="synchronize"
                                @input="synchronize"></el-input></el-col>
                        <el-col :span="4" :offset="1">LABEL</el-col>
                        <el-col :span="3" :offset="1"><el-switch v-model="form.garminDisplay"
                                @change="synchronize"></el-switch></el-col>
                    </el-row>
                </div>

            </el-form-item>
            <el-form-item label="備考">
                <el-input v-model="form.note" autosize type="textarea" @input="synchronize"></el-input>
            </el-form-item>
            <span v-html="note"></span>
        </el-form>
    </el-card>
    <el-dialog style="--el-dialog-padding-primary: 10px;" v-model="pcDialogVisible" width="30%" top="30vh"
        :append-to-body="true" :show-close="false">
        <el-row v-if="!cuePoint.groupId">PCを前後でグループ化します. 前後どちらのPCとグループ化しますか?</el-row>
        <el-row v-else>PCのグループ化を解除しますか?</el-row>
        <el-row v-if="!cuePoint.groupId">
            <el-button :disabled="!groupCandidate.pre" @click="setGroup('pre')">直前のPC</el-button>
            <el-button :disabled="!groupCandidate.post" @click="setGroup('post')">直後のPC</el-button>
            <el-button @click="pcDialogVisible = !pcDialogVisible">キャンセル</el-button>
        </el-row>
        <el-row v-else>
            <el-button @click="resetGroup">共有解除</el-button>
            <el-button @click="pcDialogVisible = !pcDialogVisible">キャンセル</el-button>
        </el-row>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, onMounted, watch, ref, computed } from 'vue'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { useBrmRouteStore } from '@/stores/BrmRouteStore'
import { useGeocodeStore } from '@/stores/GeocodeStore'
import { CuePoint } from '@/classes/cuePoint'
import { garminIcons } from '@/lib/garminIcons'
import { Markup } from '@/lib/markup'

import garmin from '@/../../resources/images/Garmin_logo_2006.svg'

const props = defineProps(['submit', 'menuParams'])
const cuesheetStore = useCuesheetStore()
const routeStore = useBrmRouteStore()
const geocodeStore = useGeocodeStore()

const directions: [number, number, string, string?][] = [
    [0, 15, '直進', 'S'],
    [75, 105, '右折', 'R'],
    [165, 195, '戻る', 'R'],    // Uターンは右旋回
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

const pcDialogVisible = ref(false)
const groupCandidate = ref(cuesheetStore.getGroupCandidate(cuePoint))
const groupAvailable = computed(() => (groupCandidate.value.pre !== undefined || groupCandidate.value.post !== undefined))

// 表題
const pointTitle = computed(() => {
    let title: string = ''
    switch (cuePoint.type) {
        case 'cue':
            title = 'ポイント'
            break
        case 'pass':
            title = '通過チェック'
            break
        case 'poi':
            title = 'POI'
            break
        case 'pc':
            if (cuePoint.terminal === undefined) {
                title = 'PC'
            } else {
                title = cuePoint.terminal === 'start' ? 'スタート' : (cuePoint.terminal === 'finish' ? 'フィニッシュ' : '')
            }
            break
    }
    return title
})

const form = reactive({ type: cuePoint.type, pcGroup: false, ...props.menuParams.cuePoint.properties })

const note = computed(() => {
    const n = new Markup(form.note)
    return n.html()
})

onMounted(async () => {

    // 進路の初期設定
    if (cuePoint.type !== 'poi' && form.direction === '') {
        const dirs = Array.from(getDirection())
        form.direction = dirs[0]
    }
    // アイコンの初期設定
    if (cuePoint.type !== 'poi' && form.garminDeviceIcon === '') {
        updateIcon()
    }

})

// cueType の変更 → アイコンの書き換え
watch(() => form.type, (newType) => { // watcher の参照を getter(関数) にしている。form そのものを監視するとすべての変更に反応してしまうため。

    if (newType === 'pc' || newType === 'pass') {
        form.garminDeviceIcon = 'Information'
        form.garminDeviceText = newType === 'pc' ? 'PC' : (newType === 'pass' ? 'CHK' : '')
    } else if (newType === 'cue') {
        updateIcon()
    } else if(newType==='poi'){
        // ポイントが POI になったときは address を検索
        cuesheetStore.setPoiAddress(cuePoint.id)
    }
    synchronize()

    // グループ状況の更新
    groupCandidate.value = cuesheetStore.getGroupCandidate(cuePoint)
})

watch(() => form.direction, (newDirection) => {
    updateIcon()
    synchronize()
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

const groupConfirm = () => {
    pcDialogVisible.value = true
}

const setGroup = (dir: 'pre' | 'post') => {
    cuesheetStore.setGroup(cuePoint.id, dir)
    pcDialogVisible.value = false
}

const resetGroup = () => {
    cuesheetStore.resetGroup(cuePoint.id)
    pcDialogVisible.value = false
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

    for (let i: number = 0; i < 3; i++) {
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

// Garmin Icon
const updateIcon = () => {
    const direction = directions.find((item) => item[2] === form.direction)
    form.garminDeviceText = direction ? direction[3] : ''
    switch (form.garminDeviceText) {
        case 'S':
            form.garminDeviceIcon = 'Pin, Green'
            break
        case 'L':
            form.garminDeviceIcon = 'Pin, Blue'
            break
        case 'R':
            form.garminDeviceIcon = 'Pin, Red'
            break
        default:
            form.garminDeviceIcon = 'Pin, Blue'
            break
    }
}

</script>

<style scoped>
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

.cue-point {
    width: 400px;
}

.cue-type {
    width: 100%;
    justify-content: space-between;
}

.cue-type :deep(.el-radio--small) {
    margin-right: 2px;
}


:deep(.el-card__body) {
    padding: 5px;
}

:deep(.el-form-item__label) {
    padding-right: 5px;
    /* color: black; */
    font-weight: bold;
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
