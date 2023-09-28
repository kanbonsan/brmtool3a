<template>
    <canvas ref="canvas" :width="width" :height="height"></canvas>
</template>

<script>
import { mapGetters, mapState } from "vuex"
export default {
    props: ["width", "height"],
    data() {
        return {
            ctx: null,
            strokeStyles: {
                cue: "grey",
                pc: "#F6993F",
                pass: "#6cb2eb",
                start: "#38C172",
                finish: "#E3342F",
            },
            fillStyles: {
                cue: "lightgrey",
                pc: "#FACC9F",
                pass: "#b5d8f5",
                start: "#9BE0B8",
                finish: "#F19997",
            },
            // ポイントのマーカーを描画したらその位置を覚えておいてクリックに反応させる
            markerCircles: [],
        }
    },

    watch: {
        paneSize: function () {
            this.draw(this.overlay)
        },

        mouse: {
            handler: function () {
                this.draw(this.overlay)
            },
            deep: true,
        },

        visible: {
            handler: function () {
                this.draw(this.overlay)
            },
        },

        // 地図上の polyline 上をマウスが動いたときに 距離-標高線を表示
        gmapMouseParams: {
            handler: function (params) {
                if (params.onMap) {
                    this.draw(this.overlay)
                }
            },
        },
    },

    created() {
        this.$nextTick(() => {
            this.ctx = this.$refs.canvas.getContext("2d")
        })
    },

    computed: {
        ...mapGetters({
            segment: "brm/segment",
            property: "profile/profileProperty",
            altByPixel: "profile/profileAltByPixel",
            cuePoints: "brm/cuePoints",
            gmapMouseParams: "gmap/mouseParams",
            drag: "profile/drag"
        }),

        ...mapState({
            visible: (state) => state.profile.visible,
        }),

        paneSize() {
            return this.width + this.height
        },

        // Window上のマウス位置 {x,y}
        mouse() {
            return this.property.mousemove
        },

        // マウス位置の座標系
        coord() {
            return this.$store.getters["profile/profileCoordinate"](
                this.mouse.x,
                this.mouse.y
            )
        },

        // メニュー表示中は overlay 表示を止める
        isLocked() {
            return this.property.menuLock
        },
    },

    mounted() {
        this.draw(this.overlay)
    },

    methods: {
        /**
         * canvas への動画はすべてこの method を通して行う.
         * 1. context を取得するのを待つため
         * 2. 描画のタイミングをずらさないとうまく描いてくれないため（原因イマイチ特定できず）
         * callback に context を渡す.
         */
        draw(callback) {
            // メニュー表示中は overlay を表示しない
            if (this.isLocked) {
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
        // 距離 → canvas X座標
        x(dist) {
            return Math.floor(
                (dist - this.property.distanceRange.begin) /
                    this.property.resolution.x
            )
        },

        // 標高メートル → canvas Y座標 (上に丸めて 0.5pixel 足す)
        y(alt) {
            return (
                Math.floor(
                    this.property.graphBody.height -
                        alt / this.property.resolution.y
                ) + 0.5
            )
        },

        overlay(ctx) {
            // マーカーの位置リストのリセット
            this.markerCircles.length = 0

            const graphX = this.gmapMouseParams.onMap
                ? this.x(this.segment.distance * this.gmapMouseParams.fraction)
                : this.coord.graphX

            const alt = this.altByPixel[graphX]
            const altStr = alt ? alt.toFixed(0) + "m" : "0m"
            const y = this.y(alt)

            const dist = this.gmapMouseParams.onMap
                ? this.segment.distance * this.gmapMouseParams.fraction
                : this.coord.distanceX
            const distStr = dist ? (dist / 1000).toFixed(1) + "km" : "--km"

            ctx.clearRect(0, 0, this.width, this.height)

            ctx.save()
            ctx.strokeStyle = this.property.axis.strokeStyle
            ctx.lineWidth = this.property.axis.lineWidth
            // clip の設定（グラフエリア）
            ctx.beginPath()
            ctx.moveTo(this.property.leftMargin, 0)
            ctx.lineTo(this.width, 0)
            ctx.lineTo(this.width, this.property.graphBody.height)
            ctx.lineTo(this.property.leftMargin, this.property.graphBody.height)
            ctx.clip()

            // キューポイント
            this.drawCuePoints(ctx)

            // キューポイント上の mousemove に反応
            this.onCuePoints(ctx)

            // 以下参照線; 

            //線ががちゃがちゃとうるさいので山に近いときだけ（100px以内）描画
            if (!this.gmapMouseParams.onMap && y - this.mouse.y > 100) {
                ctx.restore()
                return
            }
            // 標高表示モードのときは表示しない
            if(this.drag.dragging || this.drag.dragEnd){
                ctx.restore()
                return
            }
            ctx.beginPath()
            ctx.moveTo(0, y)
            ctx.lineTo(graphX + this.property.leftMargin + 0.5, y)
            ctx.lineTo(graphX + this.property.leftMargin + 0.5, this.height)
            ctx.stroke()
            ctx.restore()
            
            // 標高表示
            ctx.save()
            ctx.font = this.property.axis.font
            const wdAlt = Math.floor(ctx.measureText(altStr).width/2)*2 + 5 // + 両端マージン
            // clip
            ctx.beginPath()
            ctx.rect(
                this.property.leftMargin - wdAlt/2,
                0,
                this.property.graphBody.width + wdAlt/2,
                this.property.graphBody.height
            )
            ctx.clip()

            // 文字列の中心を基準に
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            
            // ctx.translate(this.property.leftMargin - 2.5, y)
            ctx.translate(graphX + this.property.leftMargin + 12.5  , y )
            ctx.fillStyle = "yellow"
            ctx.fillRect(0, -6, wdAlt, 12)
            ctx.strokeStyle = "blue"
            ctx.strokeRect(0, -6, wdAlt, 12)
            ctx.fillStyle = "black"
            ctx.fillText(altStr, wdAlt/2, 0)
            ctx.restore()
            
            // 距離表示
            ctx.save()
            ctx.font = this.property.axis.font
            const wdDist =
                Math.floor(ctx.measureText(distStr).width / 2) * 2 + 5 // 幅を奇数にしておかないと縦線がぼやける
            // clip
            ctx.beginPath()
            ctx.rect(
                this.property.leftMargin - wdDist/2,
                this.property.graphBody.height,
                this.width + wdDist/2,
                this.property.bottomMargin
            )
            ctx.clip()

            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            
            ctx.translate(
                graphX + this.property.leftMargin,
                this.property.graphBody.height + 2.5
            )
            ctx.strokeStyle = "blue"
            ctx.strokeRect(-wdDist / 2, 0, wdDist, 12)
            ctx.fillStyle = "yellow"
            ctx.fillRect(-wdDist / 2, 0, wdDist, 12)
            ctx.fillStyle = "black"
            ctx.fillText(distStr, 0, 5)
            ctx.restore()
        },

        drawCuePoints(ctx) {
            ctx.save()
            ctx.strokeStyle = this.property.axis.strokeStyle
            ctx.lineWidth = this.property.axis.lineWidth
            // PC をあとに描画するように描画順序を決めておく
            // cuePoints を sort する手もあるが、index だけのリストの方が早そうなのでこのようにした。
            const orderList = []
            // cuePoints はあらかじめ Poi は除かれている
            this.cuePoints.forEach((pt, index) => {
                if (pt.type === "cue") {
                    if (this.visible.cue) {
                        orderList.unshift(index)
                    }
                } else if (this.visible.pc) {
                    orderList.push(index)
                }
            })

            const y0 = this.property.graphBody.height

            orderList.forEach((idx) => {
                const poi = this.cuePoints[idx]
                const type = poi.type

                // 一番右端が切れてしまうのでグラフ内に押し込む
                let _x = this.x(poi.attachedPoint.distanceFromBegin)
                _x = _x === this.property.graphBody.width ? _x - 1 : _x
                const alt = this.altByPixel[_x]
                const x = _x + this.property.leftMargin + 0.5
                const y = this.y(alt)

                this.markerCircles.push()

                // 参照線
                ctx.save()
                ctx.lineWidth = 1
                ctx.strokeStyle = "rgba(0,0,0,0.5)"
                ctx.beginPath()
                ctx.moveTo(x, y0)
                ctx.lineTo(x, y + 2)
                ctx.stroke()
                ctx.restore()

                // 丸印
                ctx.save()
                const radius = type === "cue" ? 4 : 6
                ctx.strokeStyle = this.strokeStyles[type]
                ctx.fillStyle = this.fillStyles[type]
                ctx.beginPath()
                ctx.arc(x, y - radius - 5, radius, 0, 2 * Math.PI)
                ctx.fill()
                ctx.stroke()

                this.markerCircles.push({
                    x,
                    y: y - radius - 5,
                    radius,
                    poi,
                })

                ctx.restore()
            })

            ctx.restore()
        },

        // マウスがキューポイント上に乗ったときの処理
        // マーカーの上に乗ったら store に Poi を設定。外れたら null を設定。
        // ctx をもらっているので popover なども実装可能。
        onCuePoints(ctx) {
            const X = this.mouse.x
            const Y = this.mouse.y
            // 逆順に検索しないと重なったときに下のマーカーが選ばれてしまう
            const marker = _.reverse(this.markerCircles).find((m) => {
                const x0 = m.x - m.radius / 2
                const y0 = m.y - m.radius / 2
                const x1 = x0 + m.radius
                const y1 = y0 + m.radius
                return x0 <= X && X <= x1 && y0 <= Y && Y <= y1
            })
            this.$store.dispatch(
                "profile/setPoiBeneathMouse",
                marker ? marker.poi : null
            )
        },
    },
}
</script>