<template>
    <div ref="profile" class="profile">
        <profile-control
            class="profile-control"
            :key="controlKey"
        ></profile-control>
        <profile-option
            class="profile-option"
            :style="profileOptionStyle"
        ></profile-option>
        <profile-graph
            class="profile-graph"
            :key="hash"
            :width="dimension.width"
            :height="dimension.height"
        ></profile-graph>
    </div>
</template>

<script>
import { mapState, mapGetters } from "vuex"
import _ from "lodash"

import ProfileGraph from "@/components/profile/ProfileGraph.vue"
import ProfileControl from "@/components/profile/ProfileControl.vue"
import ProfileOption from "@/components/profile/ProfileOption.vue"

export default {
    components: {
        ProfileGraph,
        ProfileControl,
        ProfileOption,
    },
    data() {
        return {
            controlKey: 0,

            updateTs: null,
            updateTimer: null,
        }
    },
    mounted() {
        // DOM が Pane の中に書かれるタイミングが難しい
        // SplitPanes の ready イベントではうまくサイズが取得できない 0,0 になってしまう.
        const check = () => {
            if (this.$el && this.$el.clientWidth && this.$el.clientWidth > 0) {
                this.$emit("resized")
            } else {
                setTimeout(check, 50)
            }
        }
        check()
    },

    watch: {
        "brmSegment.editable": {
            handler: function (newVal) {
                const newBegin = newVal
                    ? this.brmSegment.getFractionOfIndex(newVal.begin)
                    : 0
                const newEnd = newVal
                    ? this.brmSegment.getFractionOfIndex(newVal.end)
                    : 1.0

                if (
                    this.xRangeFraction.begin === newBegin &&
                    this.xRangeFraction.end === newEnd
                ) {
                    return
                }
                this.$store.dispatch("profile/setProfileRangeFraction", {
                    begin: newVal
                        ? this.brmSegment.getFractionOfIndex(newVal.begin)
                        : 0,
                    end: newVal
                        ? this.brmSegment.getFractionOfIndex(newVal.end)
                        : 1.0,
                })
                this.controlKey += 1
            },
            deep: true,
        },

        xRangeFraction: {
            // 編集範囲が変わることによる Polyline の再描画のコストが非常に高いために
            // 範囲ぎめを連続して行えるようにした
            handler: function (newVal) {
                const nowTs = Date.now()
                if (!this.updateTs) {
                    this.updateTs = nowTs
                }
                if (this.updateTimer) {
                    if (nowTs - this.updateTs < 1000) {
                        this.updateTs = nowTs
                        clearTimeout(this.updateTimer)
                    } else {
                        return
                    }
                }
                this.updateTimer = setTimeout(async () => {
                    this.updateTs = null
                    this.updateTimer = null
                    this.$store.dispatch("brm/setEditableRange", newVal)
                    this.$store.dispatch(
                        "gmap/setFitBounds",
                        await this.$store.dispatch('brm/brmSegment/worker', {cmd: 'getBounds', data: true})
                    )
                }, 1100)
            },
            deep: true,
        },
    },

    computed: {
        ...mapState({
            display: (state) => state.display.dimension,
            xRangeFraction: (state) => state.profile.xRangeFraction,
        }),

        ...mapGetters({
            brmSegment: 'brm/segment',
            dimension: 'display/profilePane'
        }),

        // profile-graph の :key に設定。segment が書き換わったらグラフを更新する。
        hash() {
            return this.brmSegment ? this.brmSegment.hash : null
        },

        // pane のサイズは SplitPane の resize イベントによって変化している
        // reactive に変化する. これを子のコンポーネントに伝える.
        dimension() {
            return {
                width: this.display.panes.profile.width,
                height: this.display.panes.profile.height,
            }
        },

        //
        profileOptionStyle() {
            return {
                "--left-margin": `${this.$store.state.profile.leftMargin}px`,
            }
        },
    },
}
</script>

<style scoped>
.profile {
    position: relative;
    width: 100%;
    height: 100%;
}

.profile-graph {
    background: rgb(230, 230, 230);
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
}

.profile-control {
    position: absolute;
    top: 5px;
    right: 0px;
    z-index: 4;
    background: rgb(240, 240, 240, 0.75);
}

.profile-option {
    position: absolute;
    top: 5px;
    left: var(--left-margin);
    z-index: 4;
}
</style>