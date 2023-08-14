/*
Profile Map のアルゴリズム
 １）グラフの幅を wd (pixels) を与えて距離を wd になるように正規化 altNormalize
 ２）ポイント間を台形の帯で表現（x1,x2,y1,y2)
 ３）帯の部分を切り取って面積を求める関数 intersect
 ４）ピクセル幅に含まれる部分台形の面積を加える ＝ その区間の平均標高

 ※ ３）をリファクタリングすれば高速化できる
*/
const altNormalize = (listArr, divNumber) => {
    const listLen = listArr.length
    const zeroDist = listArr[0].distance
    const resolution = (listArr[listLen - 1].distance - zeroDist) / divNumber
    const listCopy = listArr.map(pt => {
        return {
            alt: pt.alt,
            dist: (pt.distance - zeroDist) / resolution
        }
    })
    listCopy[0].dist = 0
    listCopy[listLen - 1].dist = divNumber

    const altTiles = []
    for (let idx = 0; idx < listLen - 1; idx++) {
        altTiles.push({
            begin: listCopy[idx],
            end: listCopy[idx + 1]
        })
    }

    return altTiles
}

const intersect = (tile, _a, _b) => {

    const x1 = tile.begin.dist, x2 = tile.end.dist
    const y1 = tile.begin.alt, y2 = tile.end.alt

    if (x2 - x1 < 10e-6) {    //幅が狭すぎる ≒ 同一点
        return 0.0
    }

    if (_b < x1 || x2 < _a) { // 範囲外
        return 0.0
    }

    const a = _a <= x1 ? x1 : _a
    const b = x2 <= _b ? x2 : _b

    return (((a + b) / 2 - x1) * (y2 - y1) / (x2 - x1) + y1) * (b - a)

}

export const altDivide = (listArr, divNumber) => {

    const altTiles = altNormalize(listArr, divNumber)
    const list = [] // 返り値の配列

    for (let px = 0, idx = 0; px < divNumber; px++) {
        let tile = altTiles[idx]
        list[px] = 0.0
        while (tile && tile.begin.dist < px + 1) {
            list[px] += intersect(tile, px, px + 1)
            if (tile.end.dist < px + 1) {
                idx += 1
                tile = altTiles[idx] || null  // ここが undefined/null になることはないはずだが一応
            } else {
                // 次のピクセル。idx は持ち越し。
                break
            }
        }
    }

    return list
}