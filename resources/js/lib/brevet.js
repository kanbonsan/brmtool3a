
// ACPブルべの制限時間
export const limitHours = new Map([[200, 13.5], [300, 20], [360, 24], [400, 27], [600, 40], [1000, 75], [1200, 90]])   // expirations : 制限時間(hr)

// ACPブルべのPCでのオープン・クローズ時間の計算
export const calcOpenClose = function (distanceInMeter) {

    if (distanceInMeter === null) {
        return null
    }

    const d = Math.ceil(distanceInMeter / 1000) // Entrer un chiffre entier entre 1 et 2000 Si besoin, arrondir au km supérieur; Enter a whole number between 1 and 2000 If necessary, round up to the next km

    return ({
        open: Math.floor(
            (Math.min(d, 200) / 34 +
                Math.min(Math.max(d - 200, 0), 200) / 32 +
                Math.min(Math.max(d - 400, 0), 200) / 30 +
                Math.min(Math.max(d - 600, 0), 400) / 28 +
                Math.min(Math.max(d - 1000, 0), 200) / 26 +
                Math.min(Math.max(d - 1200, 0), 600) / 25 +
                Math.min(Math.max(d - 1800, 0), 200) / 24
                + 1 / 120) // 分以下四捨五入用に 30秒＝1/120時間加算
            * 60) // 分換算して秒以下を切り捨て floor
        ,
        close: Math.floor(
            (Math.min(d, 60) / 20 +
                Math.min(Math.max(d - 60, 0), 540) / 15 +
                Math.min(Math.max(d - 600, 0), 400) / 11.428 +
                Math.min(Math.max(d - 1000, 0), 200) / 13.333 +
                Math.min(Math.max(d - 1200, 0), 200) / 11 +
                Math.min(Math.max(d - 1400, 0), 400) / 10 +
                Math.min(Math.max(d - 1800, 0), 200) / 9
                + 1.0 // 最初の 60km が 20km/h なため 60/15 - 60/20 = 1時間
                + 1 / 120) // 四捨五入用 +30秒
            * 60)
    }
    )
}