<template>
    <el-card class="brm-setting">
        <el-form label-width="100px" :model="form">
            <el-form-item label="主催クラブ">
                <el-select v-model="form.clubCode" style="margin-right:5px;">
                    <el-option v-for="club in AJCLUB" :key="club.code" :label="club.clubShort" :value="club.code">
                        <span style="float:left;">{{ club.code }}</span><span style="float:right;">{{ club.clubJa }}</span>
                    </el-option>

                </el-select>
                <el-button @click="deleteClubCode" size="small" round>なし</el-button>
            </el-form-item>
            <el-form-item label="開催日">
                <el-date-picker v-model="form.brmDate"></el-date-picker>
            </el-form-item>
            <el-form-item label="スタート時間">
                <el-checkbox v-model="startNextDay" label="翌日" size="small"></el-checkbox>
                <el-time-picker style="width:100px;margin-right:5px;" v-model="startTime" format="HH:mm"></el-time-picker>
                <el-button>追加</el-button>
                <el-button v-for="dt in form.brmStart">{{ dt }}</el-button>

            </el-form-item>
            <el-form-item label="ブルベ距離">
                <el-select v-model="form.brmDistance">
                    <el-option value="200" label="200km">200km</el-option>
                    <el-option value="300" label="300km">300km</el-option>
                    <el-option value="400" label="400km">400km</el-option>
                    <el-option value="600" label="600km">600km</el-option>
                    <el-option value="1000" label="1000km">1000km</el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="説明">
                <el-input v-model="form.description"></el-input>
            </el-form-item>
        </el-form>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useToolStore } from '@/stores/ToolStore'
import { AJCLUB } from '@/lib/aj_club'

type timestamp = number

const props = defineProps(["onClose"])
const toolStore = useToolStore()


const form = reactive<
    {
        clubCode?: number,
        brmDate?: Date,
        brmStart: Date[],
        brmDistance?: number,
        description?: string,
    }
>({
    clubCode: toolStore.properties.clubCode,
    brmDate: undefined,
    brmStart: [],
    brmDistance: undefined,
    description: ''
})

// スタート時間（前日・翌日になることも考慮）
const startDate = computed(() => form.brmDate ? form.brmDate : new Date())
const startTime = ref<Date>()
const startNextDay = ref(false)

const deleteClubCode = () => { form.clubCode = undefined }

const onCancelClose = () => { props.onClose() }


onMounted(() => console.log(AJCLUB))

</script>


<style scoped>
.brm-setting {
    width: 100%;
}
</style>