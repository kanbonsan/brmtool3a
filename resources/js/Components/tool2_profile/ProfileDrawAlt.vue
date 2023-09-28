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
            oddStyle: "rgba(230,255,230)",
            evenStyle: "rgba(230, 240, 255)",
        }
    },

    watch: {
        paneSize: function () {
            this.draw(this.drawAlt)
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
            altByPixel: "profile/profileAltByPixel",
        }),
        ...mapState({
            altBase: (state) => state.profile.altBase,
        }),

        pitch() {
            return this.property.scalePitch
        },
        graphHeight() {
            return this.property.graphBody.height
        },
        graphWidth() {
            return this.property.graphBody.width
        },
        resolution() {
            return this.property.resolution
        },

        paneSize() {
            return this.width + this.height
        },
    },

    mounted() {
        this.draw(this.drawAlt)
    },

    methods: {
        /**
         * canvas への描画はすべてこの method を通して行う.
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

        y(alt) {
            return Math.floor(
                this.graphHeight - (alt - this.altBase) / this.resolution.y
            )
        },

        drawAlt(ctx) {
            const arr = this.altByPixel
            const leftMargin = this.property.leftMargin
            const x = (px) => px + leftMargin

            // プロフィールマップの屋根の部分の path
            const altPath = new Path2D()
            altPath.moveTo(x(0), this.y(arr[0]))
            for (let px = 1, len = arr.length; px < len; px++) {
                altPath.lineTo(x(px), this.y(arr[px]))
            }

            // グラフ領域の path
            const altFill = new Path2D(altPath)
            altFill.lineTo(x(arr.length - 1), this.graphHeight)
            altFill.lineTo(x(0), this.graphHeight)
            altFill.closePath()

            // 塗りつぶし部分
            ctx.save()
            // グラフ領域の clip
            ctx.beginPath()
            ctx.moveTo(leftMargin, 0)
            ctx.lineTo(this.width, 0)
            ctx.lineTo(this.width, this.graphHeight)
            ctx.lineTo(leftMargin, this.graphHeight)
            ctx.clip()
            ctx.save()
            // グラフ領域のclip
            ctx.clip(altFill)
            this.drawAltStripe(ctx)
            ctx.restore()

            // グラフ上部
            ctx.lineWidth = 1
            ctx.strokeStyle = "brown"
            ctx.stroke(altPath)
            ctx.restore()

            // 標高線
        },
        // 標高の縞模様
        drawAltStripe(ctx) {
            const minPitch = Math.floor(this.altBase / this.pitch.y)
            const startY = this.y(this.pitch.y * minPitch)
            const stripeWd = Math.ceil(this.pitch.y / this.resolution.y)

            for (let i = minPitch; startY - (i - 1) * stripeWd > 0; i++) {
                ctx.fillStyle = i % 2 === 0 ? this.evenStyle : this.oddStyle
                ctx.fillRect(0, startY - i * stripeWd, this.width, stripeWd)
            }
        },
    },
}
</script>

<style scoped>
</style>