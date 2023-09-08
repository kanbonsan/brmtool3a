<template>
    <header>
        HEADER
    </header>
    <main>
        <slot />
    </main>
    <div>
        <FooterMessage></FooterMessage>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { Link, router } from "@inertiajs/vue3"
import axios from "axios"
import { ModalsContainer } from 'vue-final-modal'
import FooterMessage from "@/Components/Footer.vue"

import { useDimension } from '@/Composables/dimension'
const { dimensionUpdate } = useDimension()


const props = defineProps(["auth", "isAuthenticated"])

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
    // 知らないうちにログアウトしてはいないかをチェックする
    // そもそもログインしていなければチェックに行かない
    setInterval(() => {
        if (isAuthenticated) {
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

