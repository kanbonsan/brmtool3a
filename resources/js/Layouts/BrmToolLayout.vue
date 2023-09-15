<template>
    <el-menu class="menu-bar" mode="horizontal">

        <el-sub-menu index="1">
            <template #title>ファイル</template>
            <el-menu-item index="1-1" @click="console.log('new brm')">新規</el-menu-item>
            <el-menu-item index="1-2">読み込み</el-menu-item>
            <el-menu-item index="1-3">保存</el-menu-item>
            <el-menu-item index="1-4">エクスポート</el-menu-item>
            <el-menu-item index="1-5">設定</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="2">ブルベ</el-menu-item>
        <div style="flex-grow:1" />
        <template v-if="$page.props.auth.user">
            <el-menu-item index="3">
                <Link :href="route('dashboard')">アカウント</Link>
            </el-menu-item>
        </template>
        <template v-else>
            <el-menu-item index="4" v-if="!$page.props.auth.user">
                <Link :href="route('login')">
                ログイン
                </Link>
            </el-menu-item>
            <el-menu-item index="5" v-if="!$page.props.auth.user">
                <Link v-if="canRegister" :href="route('register')">
                登録
                </Link>
            </el-menu-item>
        </template>
    </el-menu>
    <main>
        <slot />
    </main>

    <el-dialog class="main-dialog" v-model="menuVisible" :title="menuTitle">
        <component :is="menuComponent" :onClose="handleClose" />
    </el-dialog>
</template>

<script setup lang="ts">

/**
 * 実際のデータの読み込み（init処理）は google.maps api が読み込まれてからになるので、
 * MapPane.vue の 中で行う。
 */

import { ref, onMounted, onUnmounted, type Component } from "vue"
import { Link, router } from "@inertiajs/vue3"
import axios from "axios"

import { useToolStore } from "@/stores/ToolStore"
import BrmSetting from "@/Components/DialogMenu/BrmSetting.vue"

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
        console.log(credentials)
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
const saveData = () => { toolStore.save() }

onMounted(() => {
    window.addEventListener('beforeunload', saveData)
    setTimeout(()=>menuVisible.value = true, 1000)
})

onUnmounted(() => {
    window.removeEventListener('beforeunload', saveData)
    
})

// DIALOG
const menuVisible = ref<boolean>(false)
const menuComponent = ref<Component>()
const menuTitle = ref<string>()

menuVisible.value = false
menuTitle.value = 'ブルベ設定'
menuComponent.value = BrmSetting
const handleClose = () => console.log('handle close')

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

