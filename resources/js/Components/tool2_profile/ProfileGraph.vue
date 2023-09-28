<template>
    <div
        ref="graph"
        class="graph"
        :width="width"
        :height="height"
        :key="key"
        @click="onClick"
        @wheel="onWheel"
        @mousemove="onMousemove"
        @mousedown="onMousedown"
        @mouseup="onMouseup"
        @mouseout="onMouseout"
        @contextmenu.prevent="onContextmenu"
    >
        <!-- popper を bind するため（だけ）の div -->
        <div
            id="pop-reference"
            v-popover:popover
            v-show="popover.visible"
            :style="popRefStyles"
        ></div>
        <el-popover
            ref="popover"
            v-model="popover.visible"
            popper-class="my-popover"
            placement="right"
            trigger="hover"
            @show="menuLock"
            @hide="menuUnlock"
        >
            <component :is="popover.content" @onPopover="onPopover"></component>
        </el-popover>
        <profile-grade class="grade" :width="width" :height="height"></profile-grade>
        <profile-overlay class="overlay" :width="width" :height="height">
        </profile-overlay>
        <profile-draw-alt
            class="alt"
            :width="width"
            :height="height"
        ></profile-draw-alt>
        <profile-y-axis
            class="axis"
            :width="width"
            :height="height"
        ></profile-y-axis>
        <profile-x-axis
            class="axis"
            :width="width"
            :height="height"
        ></profile-x-axis>
    </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import _ from "lodash"
import XAxis from "@/components/profile/ProfileXAxis.vue"
import YAxis from "@/components/profile/ProfileYAxis.vue"
import DrawAlt from "@/components/profile/ProfileDrawAlt.vue"
import Overlay from "@/components/profile/ProfileOverlay.vue"
import Control from "@/components/profile/ProfileControl.vue"
import Grade from "@/components/profile/ProfileGrade.vue"

import DoubleClick from "@/components/profile/popover/DoubleClick"
import ContextMenu from "@/components/profile/popover/ContextMenu"

export default {
    props: ["width", "height"],

    components: {
        ProfileXAxis: XAxis,
        ProfileYAxis: YAxis,
        ProfileDrawAlt: DrawAlt,
        ProfileOverlay: Overlay,
        ProfileControl: Control,
        ProfileGrade: Grade,
        DoubleClick,
        ContextMenu,
    },

    data() {
        return {
            key: 1, // コンポーネントの強制書き換え用

            popover: {
                visible: false,
                refLeft: null,
                refTop: null,
                content: null, // 内容となる Vue コンポーネント
            },
        }
    },

    watch: {
        // 表示範囲が変更されたら書き換え
        xRangeFraction: {
            handler() {
                ++this.key
            },
            deep: true,
        },
        // 標高スケールの変化に対応（v1.14現在は未実装）
        altBase() {
            ++this.key
        },
    },

    computed: {
        ...mapState({
            profile: (state) => state.profile,
            altBase: (state) => state.profile.altBase,
        }),
        ...mapGetters({
            property: "profile/profileProperty",
            altByPixel: "profile/profileAltByPixel",
            xRangeFraction: "profile/xRangeFraction",
            mapObj: "gmap/mapObj"
        }),

        popRefStyles() {
            return {
                "--top": this.popover.refTop + "px",
                "--left": this.popover.refLeft + "px",
            }
        },
        isLocked() {
            return this.property.menuLock
        },
        coord() {
            return this.$store.getters["profile/profileCoordinate"](
                this.property.mousemove.x,
                this.property.mousemove.y
            )
        },
    },
    created() {
        this.onMousemove = _.debounce(this.mousemove, 10)
    },

    methods: {
        // xRangeFraction の範囲におさめる
        limitToRange(frac) {
            return Math.max(
                this.xRangeFraction.begin,
                Math.min(this.xRangeFraction.end, frac)
            )
        },

        onMousedown(ev) {
            const coord = this.$store.getters["profile/profileCoordinate"](
                ev.offsetX,
                ev.offsetY
            )
            const frac = coord.fractionX
            this.$store.dispatch("profile/dragStart", this.limitToRange(frac))
        },

        onMouseup(ev) {
            const coord = this.$store.getters["profile/profileCoordinate"](
                ev.offsetX,
                ev.offsetY
            )
            const frac = coord.fractionX
            this.$store.dispatch("profile/dragEnd", this.limitToRange(frac))
        },

        // ホイールでプロフィールマップの範囲（＝マップの編集範囲）を変える
        onWheel(ev) {
            const coord = this.$store.getters["profile/profileCoordinate"](
                ev.offsetX,
                ev.offsetY
            )
            const thisFrac = coord.fractionX
            const range = this.xRangeFraction

            const begin = Math.max(
                0.0,
                thisFrac - (thisFrac - range.begin) * (1 - ev.deltaY / 1000)
            )
            const end = Math.min(
                1.0,
                thisFrac + (range.end - thisFrac) * (1 - ev.deltaY / 1000)
            )

            this.$store.dispatch("profile/setProfileRangeFraction", {
                begin,
                end,
            })
        },

        onClick(ev) {
            const poi = this.$store.state.profile.mousemove.poi

            // Poi のマーカー上をクリックすればそこに移動して編集する（キューシートの row をクリックしたときと同じ動作）
            if (poi) {
                // poi 選択のときはドラッグモードは中止
                this.$store.dispatch("profile/dragReset")
                const map = this.$store.state.gmap.mapObj
                const cueIndex = poi.properties.cueIndex
                // センタリング
                if (map) {
                    map.panTo(poi.attachedPoint)
                    if (map.getZoom() > 15) {
                        map.setZoom(15)
                    }
                }

                this.$store.dispatch("streetview/move", poi)

                this.$store.dispatch("brm/setPoiDialog", {
                    show: true,
                    index: cueIndex,
                    poi: poi,
                })

                // キューシートをセンタリング
                if (cueIndex) {
                    this.$store.dispatch("cuesheet/scrollTo", cueIndex)
                }
                return
            }
        },

        mousemove(ev) {
            this.$store.dispatch("profile/setProfileMousemove", ev)
            if (ev.buttons === 1) {
                const coord = this.$store.getters["profile/profileCoordinate"](
                    ev.offsetX,
                    ev.offsetY
                )
                const frac = coord.fractionX
                this.$store.dispatch(
                    "profile/dragMove",
                    this.limitToRange(frac)
                )
            }
        },

        onMouseout(ev) {

            this.$store.dispatch("profile/setProfileMousemove", {
                offsetX: null,
                offsetY: null,
            })
        },

        onContextmenu(ev) {
            this.popover.refLeft = ev.offsetX
            this.popover.refTop = ev.offsetY
            this.popover.visible = true
            this.popover.content = ContextMenu
        },

        // popover 表示時は操作をロック
        menuLock() {
            this.$store.commit("profile/setProfileMenuLock", true)
        },
        menuUnlock() {
            this.$store.commit("profile/setProfileMenuLock", false)
            // コンポーネントを削除しておかないと、次も同じインスタンスが使われてメニューの切り替えがうまくいかない
            this.popover.content = null
        },

        // popover からのコマンドを受け取る
        onPopover(cmd) {
            this.popover.visible = false
            const coord = this.$store.getters["profile/profileCoordinate"](
                this.popover.refLeft,
                this.popover.refTop
            )

            switch (cmd) {
                case "showAllRange":
                    // 全範囲表示
                    this.$store.dispatch("profile/setProfileRangeFraction", {
                        begin: 0.0,
                        end: 1.0,
                    })
                    break
                case "jumpToThisPoint":
                    // マップ移動
                    console.log(coord)
                    const move = () => {
                        this.$store.dispatch("gmap/setGmapOption", {
                            fractionToCenter: coord.fractionX || null,
                        })
                    }

                    if (this.mapObj) {
                        if (this.mapObj.getZoom() > 15) {
                            this.mapObj.setZoom(15)
                            google.maps.event.addListenerOnce(this.mapObj, "idle", move)
                        } else {
                            move()
                        }

                        this.$store.dispatch(
                                    "infobar/message",
                                    `地図の中心を移動しました.`
                                )

                    }

                    break

                case "editFormer":
                    // 前を編集（後ろを除外）
                    this.$store.dispatch("profile/setProfileRangeFraction", {
                        end: coord.fractionX,
                    })
                    break
                case "editLatter":
                    // 後ろを編集（前を除外）
                    this.$store.dispatch("profile/setProfileRangeFraction", {
                        begin: coord.fractionX,
                    })
                    break

                case "cancel":
                    // 何もしない
                    break
                default:
                    console.log(
                        "ProfileGraph: 登録されていないコマンド; %s",
                        cmd
                    )
                    break
            }
        },
    },
}
</script>

<style>
.my-popover {
    min-width: 100px;
}
</style>

<style scoped>
.graph {
    background-color: rgba(255, 255, 255);
    position: relative;
}
.axis {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
}
.alt {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
}
.overlay {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 3;
}
.grade {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 4;
}
.control {
    position: absolute;
    top: 5px;
    right: 0px;
    z-index: 4;
    background: rgba(255, 255, 255, 0.5);
}

#pop-reference {
    position: absolute;
    width: 1px;
    height: 1px;
    top: var(--top);
    left: var(--left);
    z-index: 10;
}
</style>