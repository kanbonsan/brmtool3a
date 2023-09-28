<template>
    <canvas ref="canvas" :width="control.width" :height="control.height">
    </canvas>
</template>

<script>
import { mapGetters, mapState } from "vuex"
export default {
    data() {
        return {
            ctx: null,
            mouseDownObj: null,
            mouseDownInitX: null,
            mouseDownInitY: null,
            fracBegin: null,
            initFracBegin: null,
            fracEnd: null,
            initFracEnd: null,
        }
    },
    created() {
        this.$nextTick(() => {
            this.ctx = this.$refs.canvas.getContext("2d")
        })

        this.fracBegin = this.initFracBegin =
            this.$store.state.profile.xRangeFraction.begin
        this.fracEnd = this.initFracEnd =
            this.$store.state.profile.xRangeFraction.end
    },

    computed: {
        ...mapGetters({
            property: "profile/profileProperty",
            graph: "profile/miniGraph",
            xRangeFraction: "profile/xRangeFraction",
            gmapMouseParams: "gmap/mouseParams",
        }),

        ...mapState({
            control: (state) => state.profile.control, // コントロール部分のサイズ（モジュールで管理）
            segment: (state) => state.brm.segment,
            mouseFracDistance: (state) => state.profile.mousemove.fracDistanceX,
        }),

        // グラフの各種位置
        pos() {
            const left = this.control.margin.left,
                right = this.control.margin.right
            const top = this.control.margin.top,
                bottom = this.control.margin.bottom
            const wd = this.control.width - left - right,
                base = this.control.height - bottom,
                ht = base - top

            const dims = { wd, base, ht, left, right, top, bottom }
            const marker = {
                ht: 5, // 高さの半分
                wd: 7,
            }
            return { ...dims, marker }
        },
        // ドラッグするオブジェクトの位置
        obj() {
            const begin = Math.floor(this.pos.wd * this.fracBegin)
            const end = Math.floor(this.pos.wd * this.fracEnd)
            return {
                markerL: {
                    x1: this.pos.left + begin - this.pos.marker.wd - 2,
                    x2: this.pos.left + begin + 2,
                    y1: this.pos.base,
                    y2: this.pos.base + this.pos.marker.ht * 2,
                },
                markerR: {
                    x1: this.pos.left + end - 2,
                    x2: this.pos.left + end + this.pos.marker.wd + 2,
                    y1: this.pos.base,
                    y2: this.pos.base + this.pos.marker.ht * 2,
                },
                selectBarL: {
                    x1: this.pos.left + begin - 3,
                    x2: this.pos.left + begin + 1,
                    y1: this.pos.top,
                    y2: this.pos.base,
                },
                selectBarR: {
                    x1: this.pos.left + end - 1,
                    x2: this.pos.left + end + 3,
                    y1: this.pos.top,
                    y2: this.pos.base,
                },
                selectArea: {
                    x1: this.pos.left + begin + 1,
                    x2: this.pos.left + end - 1,
                    y1: this.pos.top,
                    y2: this.pos.base,
                },
                beneathSelect: {
                    x1: this.pos.left + begin + 1,
                    x2: this.pos.left + end - 1,
                    y1: this.pos.base,
                    y2: this.pos.base + this.pos.marker.ht * 2,
                },
            }
        },
    },

    watch: {
        mouseFracDistance() {
            this.draw(this.miniGraph)
        },
        gmapMouseParams: function (params) {
            if (!params.onMap) {
                return
            }
            this.$store.dispatch("profile/setFracDistanceX", params.fraction)
        },
        xRangeFraction: {
            handler: function () {
                this.fracBegin = this.initFracBegin =
                    this.$store.state.profile.xRangeFraction.begin
                this.fracEnd = this.initFracEnd =
                    this.$store.state.profile.xRangeFraction.end
                this.draw(this.miniGraph)
            },
            deep: true,
        },
    },

    mounted() {
        this.draw(this.miniGraph)

        this.$refs.canvas.addEventListener("dblclick", (e) => {
            this.onDblClick(e)
        })
        this.$refs.canvas.addEventListener("mousedown", (e) => {
            this.onMouseDown(e)
        })
        this.$refs.canvas.addEventListener("mouseup", (e) => {
            this.onMouseUp(e)
        })
        this.$refs.canvas.addEventListener("mousemove", (e) => {
            this.onMouseMove(e)
        })
        this.$refs.canvas.addEventListener("mouseout", (e) => {
            this.onMouseOut(e)
        })
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
                    window.requestAnimationFrame(() => callback(this.ctx))
                } else {
                    setTimeout(check, 50)
                }
            }
            check()
        },

        // グラフの描画
        miniGraph(ctx) {
            ctx.clearRect(0, 0, this.control.width, this.control.height)

            // 枠
            this.frame(ctx)
            // グラフ
            this.profileGraph(ctx)
            // マーカー
            this.markers(ctx)
            // マウスマーカー
            this.mouseMarker(ctx)
            // 選択範囲マスク
            this.selection(ctx)
        },

        // 枠
        frame(ctx) {
            ctx.save()
            ctx.strokeRect(
                this.pos.left - 0.5,
                this.pos.top - 0.5,
                this.pos.wd + 1,
                this.pos.ht + 1
            ) // 実際のグラフの外側 1px
            ctx.restore()
        },
        // グラフ
        profileGraph(ctx) {
            ctx.save()

            ctx.translate(this.pos.left + 0.5, this.pos.base) // 原点をグラフ原点に
            ctx.scale(1, -1) //
            ctx.strokeStyle = "brown"
            ctx.beginPath()
            for (let i = 0; i < this.pos.wd; i++) {
                ctx.moveTo(i, 0)
                ctx.lineTo(i, Math.floor((this.pos.ht - 5) * this.graph[i]))
            }
            ctx.stroke()
            ctx.restore()
        },
        // マウスを動かしたときに追従する
        mouseMarker(ctx) {
            if (this.mouseFracDistance === null) {
                return
            }
            const x = Math.floor(this.pos.wd * this.mouseFracDistance)
            const y = Math.floor((this.pos.ht - 5) * this.graph[x])
            ctx.save()
            ctx.translate(this.pos.left + 0.5, this.pos.base) // 原点をグラフ原点に
            ctx.scale(1, -1)
            ctx.fillStyle = "blue"
            ctx.beginPath()
            ctx.arc(x, y, 3, 0, 2 * Math.PI)
            ctx.fill()
            ctx.restore()
        },

        // マーカー
        markers(ctx) {
            ctx.save()
            // 原点を二段階で移動
            ctx.translate(this.pos.left, this.pos.base + this.pos.marker.ht + 1)
            ctx.fillStyle = "orange"
            // 左
            ctx.save()
            ctx.translate(Math.floor(this.pos.wd * this.fracBegin), 0)
            ctx.moveTo(0, 0)
            ctx.lineTo(-this.pos.marker.wd, -this.pos.marker.ht)
            ctx.lineTo(-this.pos.marker.wd, this.pos.marker.ht)
            ctx.fill()
            ctx.restore()
            // 左おわり → 右
            ctx.save()
            ctx.translate(Math.floor(this.pos.wd * this.fracEnd), 0)
            ctx.moveTo(0, 0)
            ctx.lineTo(this.pos.marker.wd, -this.pos.marker.ht)
            ctx.lineTo(this.pos.marker.wd, this.pos.marker.ht)
            ctx.fill()
            ctx.restore()
            // 右おわり
            ctx.restore()
        },
        // 選択範囲
        selection(ctx) {
            const lt = Math.floor(this.pos.wd * this.fracBegin)
            const rt = Math.floor(this.pos.wd * this.fracEnd)
            if (rt - lt === this.pos.wd) {
                // 全範囲選択中
                return
            }
            ctx.save()
            ctx.translate(this.pos.left, this.pos.top) // 原点をグラフ（内側）の左上
            ctx.fillStyle = "rgba( 0,0,0,0.5)"
            if (lt > 0) {
                ctx.fillRect(0, 0, lt, this.pos.ht)
            }
            if (this.pos.wd - rt > 0) {
                ctx.fillRect(rt, 0, this.pos.wd - rt, this.pos.ht)
            }
            ctx.restore()
        },
        onMouseDown(e) {
            const obj = this.getObject(e)
            if (obj === "beneathSelect") {
                return
            }
            this.mouseDownObj = obj
            this.mouseDownInitX = obj ? e.offsetX : null
            this.mouseDownInitY = obj ? e.offsetY : null
        },
        onMouseUp(e) {
            if (!this.mouseDownObj) {
                return
            }
            this.mouseDownObj = null
            this.mouseDownInitX = null
            this.mouseDownInitY = null
            this.initFracBegin = this.fracBegin
            this.initFracEnd = this.fracEnd
            this.setFraction()
        },

        setFraction() {
            this.$store.dispatch("profile/setProfileRangeFraction", {
                begin: this.fracBegin,
                end: this.fracEnd,
            })
        },

        onMouseMove(e) {
            if (!this.mouseDownObj) {
                return
            }
            const dx = e.offsetX - this.mouseDownInitX
            const fracRange = this.initFracEnd - this.initFracBegin
            const dFrac = (deltaX) => deltaX / this.pos.wd
            let _begin, _end
            switch (this.mouseDownObj) {
                case "markerL":
                case "selectBarL":
                    _begin = this.initFracBegin + dFrac(dx)
                    if (_begin < 0 || _begin > this.initFracEnd - 0.05) {
                        this.fracBegin = Math.max(
                            Math.min(_begin, this.initFracEnd - 0.05),
                            0
                        )
                        this.mouseDownObj = null
                        this.initFracBegin = this.fracBegin
                        this.setFraction()
                    } else {
                        this.fracBegin = _begin
                    }
                    break
                case "markerR":
                case "selectBarR":
                    _end = this.initFracEnd + dFrac(dx)
                    if (_end > 1.0 || _end < this.initFracBegin + 0.05) {
                        this.fracEnd = Math.min(
                            Math.max(_end, this.initFracBegin + 0.05),
                            1.0
                        )
                        this.mouseDownObj = null
                        this.initFracEnd = this.fracEnd
                        this.setFraction()
                    } else {
                        this.fracEnd = _end
                    }
                    break
                case "selectArea":
                    _begin = this.initFracBegin + dFrac(dx)
                    if (_begin < 0 || _begin > 1.0 - fracRange) {
                        this.fracBegin = Math.max(
                            Math.min(_begin, 1.0 - fracRange),
                            0
                        )

                        this.fracEnd = this.fracBegin + fracRange
                        this.initFracBegin = this.fracBegin
                        this.initFracEnd = this.fracBegin + fracRange
                        this.mouseDownObj = null
                        this.setFraction()
                    } else {
                        this.fracBegin = _begin
                        this.fracEnd = _begin + fracRange
                    }

                    break
                default:
                    break
            }
            this.draw(this.miniGraph)
        },
        onMouseOut(e) {
            if (this.mouseDownObj) {
                this.onMouseUp(e)
            }
        },

        async onDblClick(e) {
            const obj = this.getObject(e)
            if (obj === "beneathSelect") {
                this.fracBegin = this.initFracBegin = 0.0
                this.fracEnd = this.initFracEnd = 1.0
                this.setFraction()
                this.draw(this.miniGraph)
            } else if (obj === "selectArea") {
                const bb = await this.$store.dispatch('brm/brmSegment/worker', {cmd: 'getBounds', data: true})
                this.$store.dispatch("gmap/setFitBounds", bb)
            } else {
                return
            }
        },

        // マウスが押されたオブジェクトを判定（なければ null）
        getObject(e) {
            const x = e.offsetX,
                y = e.offsetY
            const list = this.obj
            for (const obj in list) {
                if (
                    list[obj].x1 < x &&
                    list[obj].x2 > x &&
                    list[obj].y1 < y &&
                    list[obj].y2 > y
                ) {
                    return obj
                }
            }
            return null
        },
    },
}
</script>