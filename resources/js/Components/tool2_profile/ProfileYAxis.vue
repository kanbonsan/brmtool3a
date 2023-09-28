<template>
    <canvas ref="canvas" :width="width" :height="height"> </canvas>
</template>

<script>
import { mapGetters, mapState } from "vuex"

export default {
    props: ["width", "height"],
    data() {
        return {
            ctx: null,
        }
    },

    watch: {
        paneSize: function () {
            this.draw(this.yAxis)
        },
    },
    created() {
        this.$nextTick(() => {
            this.ctx = this.$refs.canvas.getContext("2d")
        })
    },

    computed: {
        ...mapGetters({
            property: "profile/profileProperty",
        }),

        ...mapState({
            altBase: (state) => state.profile.altBase,
        }),

        // グラフ縦軸の目盛り間隔 (メートル)
        pitch() {
            return this.property.scalePitch.y
        },

        graphHeight() {
            return this.property.graphBody.height
        },

        // グラフ縦軸の 1ピクセルあたりの標高メートル
        resolution() {
            return this.property.resolution.y
        },

        paneSize() {
            return this.width + this.height
        },

        center() {
            return this.property.center
        },
    },

    mounted() {
        this.draw(this.yAxis)
    },

    methods: {
        /**
         * canvas への動画はすべてこの method を通して行う.
         * 1. context を取得するのを待つため
         * 2. 描画のタイミングをずらさないとうまく描いてくれないため（原因イマイチ特定できず）
         * callback に context を渡す.
         */
        draw(callback) {
            if (!callback) {
                return
            }
            const check = () => {
                if (this.ctx) {
                    // タイミングをずらさないと描画してくれない
                    window.requestAnimationFrame(() => callback(this.ctx))
                } else {
                    setTimeout(check, 50)
                }
            }
            check()
        },

        // 標高メートル → canvas Y座標 (上に丸めて 0.5px 引く)
        y(alt) {
            return (
                Math.floor(
                    this.graphHeight - (alt - this.altBase) / this.resolution
                ) + 0.5
            ) // 目盛りを軸に合わせる
        },

        yAxis(ctx) {
            ctx.save()
            ctx.strokeStyle = this.property.axis.strokeStyle
            ctx.lineWidth = this.property.axis.lineWidth
            ctx.clearRect(0, 0, this.width, this.height)
            ctx.beginPath()
            ctx.moveTo(this.property.leftMargin - 0.5, 0)
            ctx.lineTo(
                this.property.leftMargin - 0.5,
                this.height - this.property.bottomMargin + 1
            )
            ctx.stroke()
            ctx.restore()
            // 目盛り
            const minYScale = Math.floor(this.altBase / this.pitch)

            for (
                let i = minYScale;
                (i * this.pitch - this.altBase) / this.resolution <
                this.graphHeight;
                i++
            ) {
                const yPixel = this.y(i * this.pitch)
                ctx.save()
                ctx.strokeStyle = this.property.axis.strokeStyle
                ctx.lineWidth = this.property.axis.lineWidth
                ctx.moveTo(this.property.leftMargin, yPixel)
                ctx.lineTo(
                    this.property.leftMargin - this.property.axis.higeLength,
                    yPixel
                )
                ctx.stroke()
                ctx.restore()

                ctx.save()
                ctx.font = this.property.axis.font
                ctx.textAlign = "end"
                ctx.textBaseline = "middle"
                ctx.fillText(
                    i * this.pitch,
                    this.property.leftMargin -
                        this.property.axis.higeLength -
                        3,
                    yPixel
                )
                ctx.restore()
            }
        },
    },
}
</script>

<style scoped>
</style>