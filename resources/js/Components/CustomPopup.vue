<template>
    <div ref="content" style="display:block;">
        <slot :submit="submit"></slot>
    </div>
</template>

<script lang="ts">
import { Popup } from "@/classes/Popup"

interface PaneInfo {
    el?: HTMLElement
    top?: number
    bottom?: number
    left?: number
    right?: number
    width?: number
    height?: number
}

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

            class Popup extends google.maps.OverlayView {
                position?: google.maps.LatLng
                containerDiv: HTMLDivElement

                constructor() {
                    super()

                    // This zero-height div is positioned at the bottom of the bubble.
                    const bubbleAnchor = document.createElement("div")

                    bubbleAnchor.classList.add("popup-bubble-anchor")

                    // This zero-height div is positioned at the bottom of the tip.
                    this.containerDiv = document.createElement("div")
                    this.containerDiv.classList.add("popup-container")
                    this.containerDiv.appendChild(bubbleAnchor)

                    // ionally stop clicks, etc., from bubbling up to the map.
                    Popup.preventMapHitsAndGesturesFrom(this.containerDiv)
                }

                setPosition(position: google.maps.LatLng) {
                    this.position = position
                }

                setContent(content: HTMLElement) {
                    content.classList.add("popup-bubble")
                    this.containerDiv.querySelector(".popup-bubble-anchor")?.appendChild(content)
                }


                /** Called when the popup is added to the map. */
                onAdd() {
                    this.getPanes()!.floatPane.appendChild(this.containerDiv)
                }

                /** Called when the popup is removed from the map. */
                onRemove() {
                    if (this.containerDiv.parentElement) {
                        this.containerDiv.parentElement.removeChild(this.containerDiv)
                    }
                }

                /** Called each frame when the popup needs to draw itself. */
                draw() {       
                    
                    const map = this.getMap()
                    const div = map.getDiv() as HTMLElement
                    console.log(div.getBoundingClientRect())

                    // fromLatLngToDivPixel() によって地図の中央を(0,0)px とした位置を返すよう
                    // 地図の左上が (0,0) ではないみたい
                    const divPosition = this.getProjection().fromLatLngToDivPixel(
                        this.position!
                    )!

                    // Hide the popup when it is far out of view.
                    const display =
                        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
                            ? "block"
                            : "none"

                    if (display === "block") {
                        this.containerDiv.style.left = divPosition.x + "px"
                        this.containerDiv.style.top = divPosition.y - 10 + "px"
                    }

                    if (this.containerDiv.style.display !== display) {
                        this.containerDiv.style.display = display
                    }
                }
            }
            this.popup = new Popup()
        },

        params: {
            handler(params) {
                if (params?.activated === true) {
                    const el = this.$refs.content as HTMLElement
                    el.parentNode?.removeChild(el)
                    this.popup?.setContent(el)
                    this.popup?.setPosition(params.position)
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
        async submit(payload: any) {

            try {
                this.params.resolve(payload)
                this.popup?.setMap(null)
            } catch (e) {
                console.log('error return, remain popup', e)
            }

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
    width: 300px;
}
</style>




