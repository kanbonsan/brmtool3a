<template>
    <el-card class="brm-setting">
        <el-form label-width="100px" :model="form">
            <el-form-item label="主催クラブ">
                <el-select v-model="form.clubCode" clearable style="margin-right:5px;" @change="synchronize">
                    <el-option v-for="club in AJCLUB" :key="club.code" :label="club.clubShort" :value="club.code">
                        <span style="float:left;">{{ club.code }}</span><span style="float:right;">{{ club.clubJa }}</span>
                    </el-option>

                </el-select>
                {{ organization }}
            </el-form-item>
            <el-form-item label="開催日">
                <el-date-picker v-model="form.brmDate" @change="onBrmDateChange"></el-date-picker>
            </el-form-item>
            <el-form-item label="スタート時間">
                <el-checkbox v-model="startNextDay" label="翌日" size="small"></el-checkbox>
                <el-time-picker style="width:100px;margin-right:5px;" v-model="startTime" format="HH:mm"
                    :default-value="defaultStartTime"></el-time-picker>
                <el-button @click="onAddStartTime">追加</el-button>
                <el-button v-for="dt in startList" @click="onDeleteStartTime(dt.date)">{{ dt.label }}</el-button>

            </el-form-item>
            <el-form-item label="ブルベ距離">
                <el-select v-model="form.brmDistance" @change="synchronize">
                    <el-option :value="200" label="200km">200km</el-option>
                    <el-option :value="300" label="300km">300km</el-option>
                    <el-option :value="400" label="400km">400km</el-option>
                    <el-option :value="600" label="600km">600km</el-option>
                    <el-option :value="1000" label="1000km">1000km</el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="説明">
                <el-input v-model="form.description" type="textarea" autosize @change="synchronize"></el-input>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useToolStore } from '@/stores/ToolStore'
import { useCuesheetStore } from '@/stores/CueSheetStore'
import { AJCLUB } from '@/lib/aj_club'

const props = defineProps(["onClose"])
const toolStore = useToolStore()
const cuesheetStore = useCuesheetStore()


const form = reactive<
    {
        clubCode: string | undefined,
        brmDate?: Date | null,
        brmStart: Date[],
        brmDistance: number | undefined,
        description: string | undefined,
    }
>({
    clubCode: undefined,
    brmDate: undefined,
    brmStart: [],
    brmDistance: undefined,
    description: undefined
})

// 団体名
const organization = computed(() => {
    const club = AJCLUB.find(club => club.code === form.clubCode)
    return club ? club.clubJa : 'なし'
})

// スタート時間（前日・翌日になることも考慮）
const startDate = computed(() => {
    const _date: Date = form.brmDate ? form.brmDate : new Date(0)
    return new Date(_date.getTime())
})
const defaultStartTime = ref(new Date(new Date().setHours(7, 0, 0)))

// フォーム time picker 用
const startTime = ref<Date>()
// フォーム翌日 チェックボックス用
const startNextDay = ref(false)

const startList = computed(() => {

    const _sorted = form.brmStart
    _sorted.sort((a: Date, b: Date) => {
        return a.getTime() - b.getTime()
    })
    const _startDay = startDate.value.getDate()
    return _sorted.map((d) => {
        const _dayLabel = (_startDay === d.getDate()) ? '' : (!form.brmDate ? '翌/' : `${d.getDate()}日/`)
        const _minutes = `00${d.getMinutes()}`.slice(-2)
        const label = `${_dayLabel}${d.getHours()}:${_minutes}`
        return ({ date: d, ts: d.getTime(), label })
    })
})

const onBrmDateChange = () => {

    if (form.brmStart.length !== 0) {

        const _prevStart = new Date(form.brmStart[0].getTime()).setHours(0, 0, 0)   // スタート時間 日時の 0:00:00

        if (!form.brmDate) {    // ブルベ日 未設定または削除
            const _currentStart = new Date(0).setHours(0, 0, 0) // とりあえずブルベ日を epoch time（タイムゾーン影響あり）
            form.brmStart = form.brmStart.map((d) => {
                return new Date(d.getTime() - _prevStart + _currentStart)
            })
        } else {
            const _currentStart = form.brmDate.getTime()
            form.brmStart = form.brmStart.map((d) => {
                return new Date(d.getTime() - _prevStart + _currentStart)
            })
        }
    }

    synchronize()
}

const onAddStartTime = () => {
    if (!startTime.value) return    // 入力なし
    const _hh = startTime.value.getHours() + (startNextDay.value ? 24 : 0)
    const _mm = startTime.value.getMinutes()
    const _start = new Date(startDate.value)
    _start.setHours(_hh, _mm, 0)
    const found = form.brmStart!.find((st) => (st.getTime() === _start.getTime())) // すでに登録があるか
    if (!found) {
        form.brmStart!.push(_start)
    }
    defaultStartTime.value = new Date(startTime.value.getTime())
    startTime.value = undefined
    startNextDay.value = false

    synchronize()
}

const onDeleteStartTime = (date: Date) => {
    const index = form.brmStart!.findIndex(st => st === date)
    form.brmStart!.splice(index, 1)
    synchronize()
}

const synchronize = () => {
    const info = toolStore.brmInfo

    info.organization = organization.value
    info.clubCode = form.clubCode
    info.brmDate = form.brmDate?.getTime()
    info.startTime = form.brmStart.map(st => st.getTime())
    info.brmDistance = form.brmDistance
    info.description = form.description

    cuesheetStore.update()
}

onMounted(() => {
    form.clubCode = toolStore.brmInfo.clubCode
    form.brmDate = toolStore.brmInfo.brmDate ? new Date(toolStore.brmInfo.brmDate) : undefined
    form.brmStart = toolStore.brmInfo.startTime.map(ts => new Date(ts))
    form.brmDistance = toolStore.brmInfo.brmDistance
    form.description = toolStore.brmInfo.description
})

</script>


<style scoped>
.brm-setting {
    width: 100%;
}
</style>