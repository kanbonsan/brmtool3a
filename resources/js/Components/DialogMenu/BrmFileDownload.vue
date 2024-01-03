<template>
    <el-card class="brm-file-download">
        <el-row>
            BRMファイルをBRMTOOL3形式で保存します. 初代BRMTOOLで読み込める旧バージョンも選べます.
        </el-row>
        <el-row>
            <el-checkbox v-model="oldVersion">旧バージョンで保存</el-checkbox>
        </el-row>
        <el-row class="mt-3" justify="center">
            <el-button @click="onSubmit" type="primary">OK</el-button>
            <el-button @click="props.onClose">キャンセル</el-button>
        </el-row>
    </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useToolStore } from "@/stores/ToolStore"
import axios from 'axios'
import fileDownload from 'js-file-download'
import { ElMessage } from "element-plus"

const props = defineProps(['onClose'])
const toolStore = useToolStore()

const oldVersion = ref<boolean>(false)

// window.showSaveFilePicker で自在にファイルの保存をしたいところだが、safari など対応がないので保留
async function getNewFileHandle() {

    const fileName = toolStore.fileInfo.brmFileName || ''

    const options = {
        suggestedName: fileName,
        types: [

            {
                description: 'brzファイル(圧縮形式)',
                accept: {
                    'application/gzip': ['.brm.gz', '.brz']
                }
            },
            // {
            //     description: 'brmファイル',
            //     accept: {
            //         'application/json': ['.brm']
            //     }
            // },
        ]
    }
    const handle = await window.showSaveFilePicker(options as any)
    return handle

}

const onSubmit = async () => {

    console.log("filedownload")
    try {
        const brmData = toolStore.makeBrmData()
        //const handle = await getNewFileHandle()
        //const writable = await handle.createWritable()

        // ファイルネームを保存
        //toolStore.fileInfo.brmFileName = handle.name

        const response = await axios({
            method: 'post',
            url: '/api/download/brmfile',
            responseType: 'blob',
            data: {
                data: brmData,
                compress: true,
                version: oldVersion.value === true ? 1 : 3
            }
        })

        // await writable.write(response.data)
        // await writable.close()

        fileDownload(response.data, "downloadBrm.brz")

        ElMessage({ type: 'success', message: 'ファイルを保存しました.' })
    } catch (e: any) {
        ElMessage({ type: 'error', message: 'ファイルの保存に失敗しました.' })
    } finally {
        props.onClose()
    }

}

</script>

<style scoped></style>