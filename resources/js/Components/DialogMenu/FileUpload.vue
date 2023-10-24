<template>
    <el-card class="file-upload">
        <el-form label-width="100px">
            <el-upload ref="uploadRef" class="upload-demo" action="" :multiple="false" :limit="1" :auto-upload="false"
                v-model:file-list="files">
                <template #tip>
                    <div class="el-upload__tip">
                        gpxファイル、brmファイルを読み込みます.<br/> 現在編集中のデータは上書きされますのでご注意ください.
                    </div>
                </template>
                <template #trigger>
                    <el-button :disabled="files && files.length > 0" type="primary" plain>ファイル選択</el-button>
                </template>
            </el-upload>
        </el-form>
        <el-row class="mt-3" justify="center">
            <el-button :disabled="!files" class="ml-3" type="primary" @click="submitUpload">
                読み込み
            </el-button>
            <el-button @click="props.onClose">キャンセル</el-button>
        </el-row>
    </el-card>
</template>

<script setup lang="ts">
import axios from 'axios'
import { ref, onBeforeUnmount } from 'vue'
import { ElMessage, UploadUserFile } from 'element-plus'
import { useToolStore } from '@/stores/ToolStore'

const props = defineProps(['onClose'])

const uploadRef = ref()
const toolStore = useToolStore()
const files = ref<UploadUserFile[]>()

onBeforeUnmount(() => {
    files.value = []
})

const submitUpload = async () => {
    const formData = new FormData()
    // attachments[0].raw に FileObject が入ってい
    // key を 'file' としているので、API側では $request->file でファイルとして取得する
    if (files.value?.length) {
        const file = files.value[0]
        formData.append("file", file.raw!)
    }
    try {
        console.log('pre axios')
        const response = await axios({
            method: "post",
            url: "/api/upload/file",
            data: formData,
        })
        console.log('axios returns')
        // error 処理
        if (response.data.status === "error") {
            ElMessage({ type: 'warning', message: 'ファイルが上手く読み込めませんでした.' })
            files.value = []
        }
        console.log(response.data)
        const brmData = toolStore.brmDataUpload(response.data)

    } catch (error: any) {
        console.log(error)
        ElMessage({ type: 'warning', message: 'error occured' })
        files.value = []

    } finally {
        props.onClose()
    }
}

</script>

<style scoped>
.file-upload {
    width: 100%;
}
</style>