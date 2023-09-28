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
            timer: null,
        }
    },

    watch: {
        paneSize: function () {
            this.draw(this.drawRange)
        },

        drag: {
            handler: function () {
                this.draw(this.drawRange)
            },
            deep: true,
        },

        "drag.dragEnd": function (bool) {
            if (bool === true) {
                if (this.timer) {
                    clearTimeout(this.timer)
                }
                this.timer = setTimeout(() => {
                    this.$store.dispatch("profile/dragReset")
                    this.timer = null
                }, 30 * 1000)
            }
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
            drag: "profile/drag",
            segment: "brm/segment",
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
        this.draw(this.drawRange)
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

        // xFraction → グラフ座標
        fracToPx(frac) {
            if (frac === null) {
                return null
            }
            const graphWd = this.property.graphBody.width
            const fracBegin = this.property.xRangeFraction.begin
            const fracEnd = this.property.xRangeFraction.end
            const fracRange = fracEnd - fracBegin

            return Math.floor((graphWd * (frac - fracBegin)) / fracRange) + 1
        },

        y(alt) {
            return (
                Math.floor(
                    this.graphHeight - (alt - this.altBase) / this.resolution.y
                ) + 0.5
            )
        },

        clearRange(ctx) {
            // 全体の削除
            ctx.clearRect(0, 0, this.width, this.height)
        },

        // テキストボックス（中央が原点）
        _textBox(
            ctx,
            text,
            wd,
            ht,
            bgColor = "yellow",
            fgColor = "black",
            textColor = "black"
        ) {
            ctx.save()
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.strokeStyle = fgColor
            ctx.strokeWidth = 1
            ctx.font = this.property.axis.font
            ctx.fillStyle = bgColor
            ctx.fillRect(-wd / 2, -ht / 2, wd, ht)
            ctx.strokeRect(-wd / 2, -ht / 2, wd, ht)

            ctx.fillStyle = textColor
            ctx.fillText(text, 0, 0)
            ctx.restore()
        },

        // 中心テキストボックス
        textBox(
            ctx,
            text,
            ht = 12,
            bgColor = "yellow",
            fgColor = "black",
            textColor = "black"
        ) {
            ctx.save()
            ctx.font = this.property.axis.font
            const wd = Math.floor((ctx.measureText(text).width + 5) / 2) * 2 + 1 // 奇数にしておく

            this._textBox(ctx, text, wd, ht, bgColor, fgColor, textColor)
            ctx.restore()
        },

        // 左寄せテキストボックス
        textBoxL(
            ctx,
            text,
            ht = 12,
            bgColor = "yellow",
            fgColor = "black",
            textColor = "black"
        ) {
            ctx.save()
            ctx.font = this.property.axis.font
            const wd = Math.floor((ctx.measureText(text).width + 5) / 2) * 2 + 1 // 奇数にしておく
            ctx.translate(wd / 2, 0)
            this._textBox(ctx, text, wd, ht, bgColor, fgColor, textColor)
            ctx.restore()
        },

        // 右寄せテキストボックス
        textBoxR(
            ctx,
            text,
            ht = 12,
            bgColor = "yellow",
            fgColor = "black",
            textColor = "black"
        ) {
            ctx.save()
            ctx.font = this.property.axis.font
            const wd = Math.floor((ctx.measureText(text).width + 5) / 2) * 2 + 1 // 奇数にしておく
            ctx.translate(-wd / 2, 0)
            this._textBox(ctx, text, wd, ht, bgColor, fgColor, textColor)
            ctx.restore()
        },

        drawRange(ctx) {
            this.clearRange(ctx)

            const _s = this.drag.start
            const _e = this.drag.end

            // 片側が null のときに一瞬 端から塗りつぶされるのを防止
            if (_s === null || _e === null) {
                return
            }

            const arr = this.altByPixel
            const leftMargin = this.property.leftMargin
            const x = (px) => px + leftMargin

            const startPx = _s < _e ? this.fracToPx(_s) : this.fracToPx(_e)
            const endPx = _s < _e ? this.fracToPx(_e) : this.fracToPx(_s)

            const startAlt = arr[startPx]
            const startX = x(startPx)
            const startY = this.y(startAlt)

            const endAlt = arr[endPx]
            const endX = x(endPx)
            const endY = this.y(endAlt)

            const rangeArr = arr.slice(startPx, endPx+1)

            const diffAlt = endAlt - startAlt
            const dispDiffAlt =
                (diffAlt > 0 ? "+" : "-") + `${parseInt(Math.abs(diffAlt))}m`

            const distance = Math.abs(_s - _e) * this.segment.distance
            const dispDistance = `${(distance / 1000).toFixed(1)}km`

            const grade = distance !== 0 ? (diffAlt / distance) * 100 : 0 // パーセント
            const dispGrade =
                (grade > 0 ? "+" : "-") + `${Math.abs(grade).toFixed(1)}%`

            let altMax = -Infinity,
                altMin = Infinity


            // Gmap 上に情報を表示するために計算データを store.profile に送っておく
            this.$store.dispatch('profile/setGradeData',{
                minAlt: Math.min(...rangeArr),
                maxAlt: Math.max(...rangeArr),
                diffAlt: dispDiffAlt,
                distance: dispDistance,
                grade: dispGrade
            })


            // プロフィールマップの屋根の部分の path
            const altPath = new Path2D()
            altPath.moveTo(startX, startY)
            for (let px = startPx; px <= endPx; px++) {
                const alt = arr[px]
                altPath.lineTo(x(px), this.y(alt))
                altMax = altMax > alt ? altMax : alt
                altMin = altMin < alt ? altMin : alt
            }

            // グラフ領域の path
            const altFill = new Path2D(altPath)
            altFill.lineTo(endX, this.graphHeight)
            altFill.lineTo(startX, this.graphHeight)
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
            ctx.fillStyle = "#4689FF"
            ctx.fill(altFill)

            // グラフ上部
            ctx.lineWidth = 1
            ctx.strokeStyle = "brown"
            ctx.stroke(altPath)
            ctx.restore()

            // 引出線
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(startX - 5, startY)
            ctx.lineTo(endX + 20, startY)
            ctx.moveTo(endX - 5, endY)
            ctx.lineTo(endX + 20, endY)
            ctx.stroke()
            ctx.restore()

            // 標高表示
            ctx.save()
            ctx.translate(startX - 5.5, startY)
            this.textBoxR(ctx, `${parseInt(startAlt)}m`)
            ctx.restore()
            ctx.save()
            ctx.translate(endX - 5.5, endY)
            this.textBoxR(ctx, `${parseInt(endAlt)}m`)
            ctx.restore()

            // 距離表示
            ctx.save()
            ctx.translate((startX + endX) / 2, this.graphHeight - 10)
            this.textBox(
                ctx,
                dispDistance,
                12,
                "#4689FF",
                "#4689FF",
                "white"
            )
            ctx.restore()

            // 傾斜表示
            ctx.save()
            ctx.translate(endX + 10, (startY + endY) / 2)
            ctx.font = "12px sans-serif"
            ctx.fillStyle = "white"
            ctx.fillRect(0, -30, 125, 60)
            ctx.fillStyle = "black"
            ctx.textAlign = "right"
            ctx.textBaseline = "middle"

            ctx.fillText("標高差:", 60, -20)
            ctx.fillText("区間距離:", 60, 0)
            ctx.fillText("平均斜度:", 60, 20)

            ctx.fillText(dispDiffAlt, 120, -20)
            ctx.fillText(dispDistance, 120, 0)
            ctx.fillText(dispGrade, 120, 20)

            ctx.restore()
        },
    },
}
</script>

<style scoped>
</style>