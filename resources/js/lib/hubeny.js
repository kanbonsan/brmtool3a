/**
 * ヒュベニの距離計算式を使用して、2点({latitude1,longitude1}, {latitude2,longitude2})間の
 * 距離を求める。測地系にはWGS84を使用。
 *
 * 参考：
 * - ヒュベニの距離計算式の簡略式( http://www.kashmir3d.com/kash/manual/std_siki.htm )
 * - 正式な公式は http://www.amano-tec.com/apps/paceruler.html を参照

 * @param {float} latitude1 開始緯度
 * @param {float} longitude1 開始経度
 * @param {float} latitude2 終了緯度
 * @param {float} longitude2 終了経度
 * @returns {Number} 2点間の距離（メートル）
 */
export function hubeny(latitude1, longitude1, latitude2, longitude2) {

    // return distVincenty( latitude1, longitude1, latitude2, longitude2 );

    // 先に計算しておいた定数
    let e2 = 0.00669437999019758   // WGS84における「離心率e」の2乗
    let Rx = 6378137.0             // WGS84における「赤道半径Rx」
    let m_numer = 6335439.32729246 // WGS84における「子午線曲率半径M」の分子(Rx(1-e^2))

    function deg2rad(deg) {
        return deg * (Math.PI / 180.0)
    }

    let rad_lat1 = deg2rad(latitude1)
    let rad_lon1 = deg2rad(longitude1)
    let rad_lat2 = deg2rad(latitude2)
    let rad_lon2 = deg2rad(longitude2)

    let dp = rad_lat1 - rad_lat2       // 2点の緯度差
    let dr = rad_lon1 - rad_lon2       // 2点の経度差
    let p = (rad_lat1 + rad_lat2) / 2.0// 2点の平均緯度

    let w = Math.sqrt(1.0 - e2 * Math.pow(Math.sin(p), 2))
    let m = m_numer / Math.pow(w, 3)   // 子午線曲率半径
    let n = Rx / w                     // 卯酉(ぼうゆう)線曲率半径

    // 2点間の距離(単位m)
    let d = Math.sqrt(Math.pow((m * dp), 2)
        + Math.pow((n * Math.cos(p) * dr), 2))
    return d
}

/*!
 * JavaScript function to calculate the geodetic distance between two points specified by latitude/longitude using the Vincenty inverse formula for ellipsoids.
 *
 * Original scripts by Chris Veness
 * Taken from http://movable-type.co.uk/scripts/latlong-vincenty.html and optimized / cleaned up by Mathias Bynens <http://mathiasbynens.be/>
 * Based on the Vincenty direct formula by T. Vincenty, “Direct and Inverse Solutions of Geodesics on the Ellipsoid with application of nested equations”, Survey Review, vol XXII no 176, 1975 <http://www.ngs.noaa.gov/PUBS_LIB/inverse.pdf>
 *
 * @param   {Number} lat1, lon1: first point in decimal degrees
 * @param   {Number} lat2, lon2: second point in decimal degrees
 * @returns {Number} distance in metres between points
 */

//function toRad(n) {
//    return n * Math.PI / 180;
//};
//
//function distVincenty(lat1, lon1, lat2, lon2) {
//    var a = 6378137,
//            b = 6356752.3142,
//            f = 1 / 298.257223563, // WGS-84 ellipsoid params
//            L = toRad(lon2 - lon1),
//            U1 = Math.atan((1 - f) * Math.tan(toRad(lat1))),
//            U2 = Math.atan((1 - f) * Math.tan(toRad(lat2))),
//            sinU1 = Math.sin(U1),
//            cosU1 = Math.cos(U1),
//            sinU2 = Math.sin(U2),
//            cosU2 = Math.cos(U2),
//            lambda = L,
//            lambdaP,
//            iterLimit = 100;
//    do {
//        var sinLambda = Math.sin(lambda),
//                cosLambda = Math.cos(lambda),
//                sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
//        if (0 === sinSigma) {
//            return 0; // co-incident points
//        }
//        ;
//        var cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda,
//                sigma = Math.atan2(sinSigma, cosSigma),
//                sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma,
//                cosSqAlpha = 1 - sinAlpha * sinAlpha,
//                cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha,
//                C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
//        if (isNaN(cos2SigmaM)) {
//            cos2SigmaM = 0; // equatorial line: cosSqAlpha = 0 (§6)
//        };
//        
//        lambdaP = lambda;
//        lambda = L + (1 - C) * f * sinAlpha * (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
//    } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
//
//    if (!iterLimit) {
//        return NaN; // formula failed to converge
//    };
//
//    var uSq = cosSqAlpha * (a * a - b * b) / (b * b),
//            A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq))),
//            B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq))),
//            deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM))),
//            s = b * A * (sigma - deltaSigma);
//    return s.toFixed(3); // round to 1mm precision
//};