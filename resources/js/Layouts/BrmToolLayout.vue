<template>
    <el-menu class="menu-bar" mode="vertical" style="--el-menu-item-height: 24px;">
        <div style="width:100%">
            <el-row justify="center" style="font-size: 14px;font-weight:bold;"> BRMTOOL ver xx</el-row>
            <el-row><el-menu-item index="1">ファイル</el-menu-item>
                <el-menu-item index="2">ブルベ</el-menu-item>

                <div style="flex-grow:1;" />
                <el-menu-item index="3">
                    <Link v-if="$page.props.auth.user" :href="route('dashboard')">
                    アカウント</Link>
                </el-menu-item>
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
            </el-row>
        </div>
    </el-menu>
    <main>
        <slot />
    </main>
</template>

<script setup lang="ts">

/**
 * 実際のデータの読み込み（init処理）は google.maps api が読み込まれてからになるので、
 * MapPane.vue の 中で行う。
 */

import { ref, onMounted, onUnmounted } from "vue"
import { router } from "@inertiajs/vue3"
import axios from "axios"
import FooterMessage from "@/Components/Footer.vue"

import { useToolStore } from "@/stores/ToolStore"
import { Link } from "@inertiajs/vue3"

const props = defineProps<{
    canLogin?: boolean
    canRegister?: boolean
    laravelVersion: string
    phpVersion: string
}>()

const credentials = ref({
    email: "",
    password: "",
})

const loginSubmit = () => {
    console.log("submit")
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
})

onUnmounted(() => {
    window.removeEventListener('beforeunload', saveData)
})
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

