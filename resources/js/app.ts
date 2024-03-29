import './bootstrap'
import '../css/app.css'

import { createApp, h, DefineComponent } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { ZiggyVue } from '../../vendor/tightenco/ziggy/dist/vue.m'

import { createPinia } from 'pinia'
import piniaPluginPersistedState from 'pinia-plugin-persistedstate'
const pinia = createPinia()
pinia.use(piniaPluginPersistedState)

// element plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import ja from 'element-plus/dist/locale/ja.min.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'BRMTOOL3'

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.vue`, import.meta.glob<DefineComponent>('./Pages/**/*.vue')),
    setup({ el, App, props, plugin }) {
        const app = createApp({ render: () => h(App, props) })
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            app.component(key, component)
        }
        app.use(plugin)
            .use(ZiggyVue, Ziggy)
            .use(ElementPlus, {locale:ja})
            .use(pinia)
            .mount(el)

    },
    progress: {
        color: '#4B5563',
    },
})
