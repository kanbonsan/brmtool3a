<template>
    <el-menu class="menu-bar">
        BRMTOOL
        <el-menu-item index="1">ファイル</el-menu-item>
        <el-menu-item index="2">ブルベ</el-menu-item>
        <el-menu-item index="">アカウント</el-menu-item>
    </el-menu>
    <!-- <header>
        BRMTOOL3
        <Link v-if="$page.props.auth.user" :href="route('dashboard')"
            class="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500">
        Dashboard</Link>
        <template v-else>
            <Link :href="route('login')"
                class="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500">
            Log in</Link>

            <Link v-if="canRegister" :href="route('register')"
                class="ml-4 font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500">
            Register</Link>
        </template>
    </header> -->
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

