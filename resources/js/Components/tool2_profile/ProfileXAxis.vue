<template>
    <canvas ref="canvas" :width="width" :height="height"> </canvas>
</template>

<script>
import { mapGetters } from "vuex"
export default {
    props: ["width", "height"],
    data() {
        return {
            ctx: null,
        }
    },

    watch: {
        paneSize: function () {
            this.draw(this.xAxis)
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

        pitch() {
            // メートル
            return this.property.scalePitch.x
        },

        graphWidth() {
            return this.property.graphBody.width
        },

        graphHeight() {
            return this.property.graphBody.height
        },

        resolution() {
            return this.property.resolution.x
        },

        paneSize() {
            return this.width + this.height
        },

        center() {
            return this.property.center
        },
    },

    mounted() {
        this.draw(this.xAxis)
    },

    methods: {
        /**
         * canvas への動画はすべてこの method を通して行う.
         * 1. context を取得するのを待つため
         * 2. 描画のタイミングをずらさないとうまく描いてくれないため（原因イマイチ特定できず）
         * callback に context を渡す.
         */
        draw(callback) {
            const check = () => {
                if (this.ctx) {
                    // タイミングをずらさないと描画してくれない
                    //setTimeout(() => callback(this.ctx), 10)
                    window.requestAnimationFrame(() => callback(this.ctx))
                } else {
                    setTimeout(check, 50)
                }
            }
            check()
        },
        x(dist) {
            const distFromOrigin = dist - this.property.distanceRange.begin
            return (
                Math.floor(
                    this.property.leftMargin + distFromOrigin / this.resolution
                ) + 0.5
            )
        },
        // 標高メートル → canvas Y座標 (上に丸めて 0.5pixel 引く)
        y(alt) {
            return Math.floor(this.graphHeight - alt / this.resolution) - 0.5
        },
        xAxis(ctx) {
            ctx.clearRect(0, 0, this.width, this.height)

            ctx.save()
            // cliping path
            ctx.beginPath()
            ctx.moveTo(this.property.leftMargin - 3, this.height)
            ctx.lineTo(this.width, this.height)
            ctx.lineTo(this.width, this.property.graphBody.height)
            ctx.lineTo(
                this.property.leftMargin - 3,
                this.property.graphBody.height
            )
            ctx.clip()

            ctx.strokeStyle = this.property.axis.strokeStyle
            ctx.lineWidth = this.property.axis.lineWidth

            ctx.beginPath()
            ctx.moveTo(
                this.property.leftMargin - 1,
                this.height - this.property.bottomMargin + 0.5
            )
            ctx.lineTo(
                this.width,
                this.height - this.property.bottomMargin + 0.5
            )
            ctx.stroke()

            const minXScale = Math.floor(
                this.property.distanceRange.begin / this.pitch
            )
            for (
                let i = minXScale;
                i * this.pitch < this.property.distanceRange.end;
                i++
            ) {
                ctx.strokeStyle = this.property.axis.strokeStyle
                ctx.lineWidth = this.property.axis.lineWidth
                ctx.moveTo(this.x(i * this.pitch) - 1, this.y(0)) // 正確には 1px 右かもしれないが、0点を Y軸に合わせるために調整。
                ctx.lineTo(
                    this.x(i * this.pitch) - 1,
                    this.y(0) + this.property.axis.higeLength
                )
                ctx.stroke()

                ctx.font = this.property.axis.font
                ctx.textAlign = "center"
                ctx.textBaseline = "top"
                ctx.fillText(
                    (i * this.pitch) / 1000,
                    this.x(i * this.pitch) - 1,
                    this.y(0) + this.property.axis.higeLength + 3
                )
            }
            ctx.restore()
        },
    },
}
</script>

<style scoped>
</style>