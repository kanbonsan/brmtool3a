<template>
    <v-app id="tool">
        <v-app-bar class="elevation-3" color="primary" density="comfortable">
            <v-container class="fill-height d-flex align-center" :fluid="true">
                <v-avatar class="me-10 ms-4" color="grey-darken-1" size="32"></v-avatar>

                <v-btn v-for="link in links" :key="link" variant="text">
                    {{ link }}
                </v-btn>

                <v-spacer></v-spacer>

                <div>
                    <template v-if="!isAuthenticated">
                        <v-btn @click="loginDialog = true"> Login </v-btn>
                        <v-btn>Register</v-btn> </template><template v-else>
                        <v-btn @click="logout">Logout</v-btn>
                    </template>
                </div>
            </v-container>
        </v-app-bar>

        <v-main class="bg-grey-lighten-3">
            <v-responsive height="100%">
                <slot />
            </v-responsive>
        </v-main>

        <v-dialog v-model="loginDialog" width="auto">
            <v-card>
                <v-card-title class="vss-movable">ログイン</v-card-title>
                <v-card-text>
                    <v-text-field v-model="credentials.email" label="メールアドレス" type="text"></v-text-field>
                    <v-text-field v-model="credentials.password" label="パスワード" :type="showPassword ? 'text' : 'password'"
                        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                        @click:append="showPassword = !showPassword"></v-text-field>
                    <v-btn variant="outlined" @click="loginSubmit">ログイン</v-btn>
                    <v-btn variant="outlined">キャンセル</v-btn>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { Link, router } from "@inertiajs/vue3"
import axios from "axios"

console.log(import.meta.env.VITE_GOOGLE_MAPS_KEY)

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
});

/* add class .vss-movable to <v-card-title> to make a dialog movable */

/*
    Vuetify のダイアログをドラッグ可能にするハック（https://stackoverflow.com/questions/71168747/how-to-make-vuetify-dialog-draggable）
*/

(function () {
    const d = {}
    const isMovable = (targ) => {
        return targ.classList?.contains("vss-movable")
    }
    document.addEventListener("mousedown", e => {
        const closestDialog = e.target.closest(".v-overlay__content")
        const title = closestDialog?.querySelector(".v-card-title")
        if (e.button === 0 && closestDialog != null && (isMovable(e.target)) || isMovable(e.target.parentNode)) {
            d.el = closestDialog // movable element
            d.handle = title // enable dlg to be moved down beyond bottom
            d.mouseStartX = e.clientX
            d.mouseStartY = e.clientY
            d.elStartX = d.el.getBoundingClientRect().left
            d.elStartY = d.el.getBoundingClientRect().top
            d.el.style.position = "fixed"
            d.el.style.margin = 0
            d.oldTransition = d.el.style.transition
            d.el.style.transition = "none"
        }
    })
    document.addEventListener("mousemove", e => {
        if (d.el === undefined) return
        d.el.style.left = Math.min(
            Math.max(d.elStartX + e.clientX - d.mouseStartX, 0),
            window.innerWidth - d.el.getBoundingClientRect().width
        ) + "px"
        d.el.style.top = Math.min(
            Math.max(d.elStartY + e.clientY - d.mouseStartY, 0),
            window.innerHeight - d.handle.getBoundingClientRect().height
        ) + "px"
    })
    document.addEventListener("mouseup", () => {
        if (d.el === undefined) return
        d.el.style.transition = d.oldTransition
        d.el = undefined
    })
})()
</script>

<style>
.v-overlay.v-dialog .vss-movable {
    cursor: grab;
}

.v-overlay.v-dialog .vss-movable:hover {
    background-color: #eee;
}

.v-overlay.v-dialog .vss-movable:active {
    cursor: grabbing;
}
</style>

