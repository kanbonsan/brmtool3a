<template>
    <div ref="content" style="display:block;">
        <slot :submit="submit"></slot>
    </div>
</template>

<script lang="ts">
/**
 * Gmap 内のカスタムポップアップ
 
 */
import type { Popup } from "@/classes/Popup"

export default {

    props: ['api', 'map', 'ready', 'params'],

    data() {

        return <{
            popup: Popup | null,
            timer: number | null,
        }>

            {
                popup: null,
                timer: null,    // タイムアウト処理のためのタイマー
            }
    },

    render() { },

    watch: {
        ready(ready) {
            if (!ready) return

            // google maps api が読み込まれたあとでないと Popup クラスが作れない
            // Popup クラスは google maps のドキュメントから引用
            // Popup.ts を参照
            import("@/classes/Popup").then((module) => {
                this.popup = new module.Popup()
            })
        },

        params: {
            handler(params) {
                if (params?.activated === true) {
                    const el = this.$refs.content as HTMLElement
                    el.parentNode?.removeChild(el)
                    this.popup?.setContent(el)
                    this.popup?.setPosition(params.position)
                    this.popup?.setOffset(params.options.offsetX, params.options.offsetY)
                    this.popup?.setTimeoutMs(params.options.timeout)
                    this.popup?.setSubmitCallback(this.submit)
                    this.popup?.setMap(this.map)
                } else {
                    this.popup?.setMap(null)
                }
            },
            immediate: true
        }
    },

    methods: {

        /**
         * Slot からの submit を親コンポーネントにスルーする
         * 親コンポーネントからエラーが帰ったらそのまま表示
         * @param payload 
         */
        submit(payload: any) {
            // 親コンポーネントの Popup を完了する promise を解決
            this.params.resolve(payload)
            this.popup?.setMap(null)

        }
    }
}

</script>
<style>
/* The popup bubble styling. */
.popup-bubble {
    /* Position the bubble centred-above its parent. */
    position: absolute;
    top: 0;
    left: 0;
    transform: translate(-50%, -100%);
    /* Style the bubble. */
    background-color: white;
    padding: 5px;
    border-radius: 5px;
    font-family: sans-serif;
    overflow-y: auto;
    max-height: 500px;
    box-shadow: 0px 2px 10px 1px rgba(0, 0, 0, 0.5);
}

/* The parent of the bubble. A zero-height div at the top of the tip. */
.popup-bubble-anchor {
    /* Position the div a fixed distance above the tip. */
    position: absolute;
    width: 100%;
    bottom: 8px;
    left: 0;
}

/* This element draws the tip. */
.popup-bubble-anchor::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    /* Center the tip horizontally. */
    transform: translate(-50%, 0);
    /* The tip is a https://css-tricks.com/snippets/css/css-triangle/ */
    width: 0;
    height: 0;
    /* The tip is 8px high, and 12px wide. */
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 8px solid white;
}

/* JavaScript will position this div at the bottom of the popup tip. */
.popup-container {
    cursor: auto;
    height: 0;
    position: absolute;
    /* The max width of the info window. */
    width: 400px;
}
</style>




