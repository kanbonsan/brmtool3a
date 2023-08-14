// update 日時のフォーマッター
export default function(dt) {
    // [閾値, オプション] のペア eg 週前は 2週以上前で適応とするが、割る秒数は当然 7日分
    const def = new Map([
        [365 * 24 * 3600, "年"],
        [30 * 24 * 3600, "月"],
        [14 * 24 * 3600, { unit: 7 * 24 * 3600, postfix: "週" }],
        [24 * 3600, "日"],
        [60 * 60, "時間"],
        [60, "分"],
        [0, { unit: 1, postfix: "秒" }],
    ])
    const ts = new Date(dt)
    const elapseSec = (Date.now() - ts.getTime()) / 1000 // ミリ秒→秒

    const date = `${ts.getFullYear()}/${
        ts.getMonth() + 1
    }/${ts.getDate()}`

    const time = `${ts.getHours()}:${("00" + ts.getMinutes()).slice(
        -2
    )}`

    let elapse = ""
    for (let [limit, opt] of def) {
        let unit, postfix
        if (typeof opt === "object") {
            unit = opt.unit
            postfix = opt.postfix
        } else {
            unit = limit
            postfix = opt
        }
        if (elapseSec > limit) {
            elapse = `約${Math.round(elapseSec / unit)}${postfix}前`
            break
        }
    }

    return { elapse, date, time }
}