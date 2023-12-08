<template>
    <el-menu class="menu-bar" mode="horizontal" :ellipsis="false">
        <el-sub-menu index="1">
            <template #title>ファイル</template>
            <el-menu-item index="1-1">新規</el-menu-item>
            <el-menu-item index="1-2" @click="openDialog(FileUpload, 'ファイル読み込み', { width: '300px' })">読み込み</el-menu-item>
            <el-menu-item index="1-3"
                @click="openDialog(BrmFileDownload, 'BRMファイルダウンロード', { width: '300px' })">保存</el-menu-item>
            <el-menu-item index="1-4">エクスポート</el-menu-item>
            <el-menu-item index="1-5" @click="devTest">開発テスト</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="2">
            <template #title>編集</template>
            <el-menu-item index="2-1" :disabled="!undo" @click="execUndo">{{ undoText }}</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="3" @click="openDialog(BrmSetting, 'ブルベ設定')">ブルベ設定</el-menu-item>
        <div style="flex-grow:1" />
        <template v-if="$page.props.auth.user">
            <el-sub-menu index="4">
                <template #title>アカウント</template>
                <el-menu-item index="4-1">
                    <Link :href="route('dashboard')">アカウント情報</Link>
                </el-menu-item>
                <el-menu-item index="4-2">
                    <Link :href="route('logout')">ログアウト</Link>
                </el-menu-item>
            </el-sub-menu>
        </template>
        <template v-else>
            <el-menu-item index="5" v-if="!$page.props.auth.user">
                <Link :href="route('login')">
                ログイン
                </Link>
            </el-menu-item>
            <el-menu-item index="6" v-if="!$page.props.auth.user">
                <Link v-if="canRegister" :href="route('register')">
                登録
                </Link>
            </el-menu-item>
        </template>
    </el-menu>
    <main>
        <slot />
    </main>

    <el-dialog class="main-dialog" v-model="menuVisible" :title="menuTitle" :style="dialogStyle" :destroy-on-close="true">
        <component :is="menuComponent" :onClose="handleClose" />
    </el-dialog>
</template>

<script setup lang="ts">

/**
 * 実際のデータの読み込み（init処理）は google.maps api が読み込まれてからになるので、
 * MapPane.vue の 中で行う。
 */

import { ref, computed, onMounted, onUnmounted, type Component } from "vue"
import { Link, router } from "@inertiajs/vue3"
import axios from "axios"

import { useToolStore } from "@/stores/ToolStore"
import BrmSetting from "@/Components/DialogMenu/BrmSetting.vue"
import FileUpload from "@/Components/DialogMenu/FileUpload.vue"
import BrmFileDownload from "@/Components/DialogMenu/BrmFileDownload.vue"

const props = defineProps<{
    canLogin?: boolean
    canRegister?: boolean
}>()

const credentials = ref({
    email: "",
    password: "",
})

const loginSubmit = () => {
    axios.get("/sanctum/csrf-cookie").then((response) => {
        axios
            .post("/login", credentials.value)
            .then((response) => router.reload())
            .catch((e) => router.reload())
    })
}

const logout = () => {
    axios.post("logout").then((response) => router.reload())
}

const toolStore = useToolStore()

// データの自動保存（イベントをリムーブするためにラップ関数に）
const saveData = () => { toolStore.save() }

// Undo 機能
// 一回だけの undo
// undo データは sessionStorage に保存して自動バックアップとは別に
const undo = computed(() => {
    const undoInfo = toolStore.undoInfo
    if (undoInfo.ts === undefined) {
        return undefined
    } else {
        return undoInfo
    }
})
const undoTime = ref('0秒前')
const undoText = computed(()=>{
    if(!undo.value){
        return "やり直し"   // placeholder 的な
    } else {
        return `「${undo.value.desc}」をやり直し　(${undoTime.value})`
    }
})
const execUndo = async ()=>{
    const result = await toolStore.undo()
}

const devTest = async () => {
    console.log('save')
    toolStore.save()
    console.log('done')

    return true
}

onMounted(() => {
    // 閉じる前のデータ保存
    window.addEventListener('beforeunload', saveData)
    window.setInterval(() => {
        if (undo.value !== undefined) {
            let ago = ''
            const elapsed = (Date.now() - undo.value.ts!) / 1000
            if (elapsed > 365 * 24 * 3600) {
                ago = `約${(elapsed / 365 / 24 / 3600).toFixed(0)}年前`
            } else if (elapsed > 30 * 24 * 3600) {
                ago = `約${(elapsed / 30 / 24 / 3600).toFixed(0)}ヶ月前`
            } else if (elapsed > 24 * 3600) {
                ago = `約${(elapsed / 24 / 3600).toFixed(0)}日前`
            } else if (elapsed > 3600) {
                ago = `約${(elapsed / 3600).toFixed(0)}時間前`
            } else if (elapsed > 60) {
                ago = `約${(elapsed / 60).toFixed(0)}分前`
            } else {
                ago = `${elapsed.toFixed(0)}秒前`
            }
            undoTime.value = ago
        } else {
            undoTime.value = '0秒前'
        }
    }, 10_000)
})

onUnmounted(() => {
    window.removeEventListener('beforeunload', saveData)

})

// DIALOG
const menuVisible = ref<boolean>(false)
const menuComponent = ref<Component>()
const menuTitle = ref<string>()
const dialogStyle = ref<any>()

const openDialog = (component: Component, title: string, options?: any) => {
    if (menuVisible.value === true) return
    if (options) {
        dialogStyle.value = { ...options }
    }
    menuComponent.value = component
    menuTitle.value = title
    menuVisible.value = true
}

const handleClose = () => {
    menuVisible.value = false
}

</script>

<style>
body {
    height: 100vh;
    width: 100vw;
    scrollbar-width: none;
}

body::-webkit-scrollbar {
    display: none;
}

.main-dialog .el-dialog__header {
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary-dark-2);
    margin-right: 0px;
}

.main-dialog .el-dialog__body {
    padding: 0px;
}
</style>

<style scoped>
.menu-bar {
    background: lightgreen;
}


header,
footer,
aside,
main {
    margin: 0px;
    padding: 0px;
    text-transform: uppercase;
    color: #666;
    border: 1px solid rgba(0, 0, 0, 0.07);
}

header,
footer {
    background-color: #256f8d;
}

header {
    height: 36px;
}

footer {
    height: 24px;
}

aside {
    background-color: #fef2ff;
}

main {
    height: calc(100vh - 60px);
    width: 100%;
    background-color: #efffed;
}
</style>

