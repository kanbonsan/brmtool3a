<template>
    <header>
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
    </header>
    <main>
        <slot />
    </main>
    <div>
        <FooterMessage></FooterMessage>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { Head, Link, router } from "@inertiajs/vue3"
import axios from "axios"
import FooterMessage from "@/Components/Footer.vue"

import { useDimension } from '@/Composables/dimension'
const { dimensionUpdate } = useDimension()
const props = defineProps<{
    anLogin?: boolean
    canRegister?: boolean
    laravelVersion: string
    phpVersion: string
    auth: any
    isAuthenticated: boolean
}>()

const links = ref(["Dashboard", "Messages", "Profile", "Updates", "Help"])

const loginDialog = ref(false)
const credentials = ref({
    email: "",
    password: "",
})
const showPassword = ref(false)

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

onMounted(() => {
    console.log('props', props)
    // 知らないうちにログアウトしてはいないかをチェックする
    // そもそもログインしていなければチェックに行かない
    setInterval(() => {
        if (props.isAuthenticated) {
            axios
                .post("/check")
                .then((res) => {
                    if (!res.data.loggedin) {
                        router.reload()
                    } else {
                        console.log("loggedin")
                    }
                })
                .catch((e) => {
                    console.log("loggedout")
                    router.reload()
                })
        }
    }, 60_000)

    window.addEventListener('resize', dimensionUpdate)
})

onUnmounted(() => { window.removeEventListener('resize', dimensionUpdate) })

/* add class .vss-movable to <v-card-title> to make a dialog movable */

/*
    Vuetify のダイアログをドラッグ可能にするハック（https://stackoverflow.com/questions/71168747/how-to-make-vuetify-dialog-draggable）
*/

    // (function () {
    //     const d = {}
    //     const isMovable = (targ) => {
    //         return targ.classList?.contains("vss-movable")
    //     }
    //     document.addEventListener("mousedown", e => {
    //         const closestDialog = e.target.closest(".v-overlay__content")
    //         const title = closestDialog?.querySelector(".v-card-title")
    //         if (e.button === 0 && closestDialog != null && (isMovable(e.target)) || isMovable(e.target.parentNode)) {
    //             d.el = closestDialog // movable element
    //             d.handle = title // enable dlg to be moved down beyond bottom
    //             d.mouseStartX = e.clientX
    //             d.mouseStartY = e.clientY
    //             d.elStartX = d.el.getBoundingClientRect().left
    //             d.elStartY = d.el.getBoundingClientRect().top
    //             d.el.style.position = "fixed"
    //             d.el.style.margin = 0
    //             d.oldTransition = d.el.style.transition
    //             d.el.style.transition = "none"
    //         }
    //     })
    //     document.addEventListener("mousemove", e => {
    //         if (d.el === undefined) return
    //         d.el.style.left = Math.min(
    //             Math.max(d.elStartX + e.clientX - d.mouseStartX, 0),
    //             window.innerWidth - d.el.getBoundingClientRect().width
    //         ) + "px"
    //         d.el.style.top = Math.min(
    //             Math.max(d.elStartY + e.clientY - d.mouseStartY, 0),
    //             window.innerHeight - d.handle.getBoundingClientRect().height
    //         ) + "px"
    //     })
    //     document.addEventListener("mouseup", () => {
    //         if (d.el === undefined) return
    //         d.el.style.transition = d.oldTransition
    //         d.el = undefined
    //     })
    // })()
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
.w-app {
    padding: 0px;
    background-color: #fffeed;
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
    background-color: #e9f8fe;
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

