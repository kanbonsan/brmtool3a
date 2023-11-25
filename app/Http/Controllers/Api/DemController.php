<?php

/**
 * 国土地理院 標高タイルを用いて標高値を得る API
 * - $dem_source を上から順に検索
 * - タイルが用意されていなければ .na とし読み込み時のタイムスタンプを記録
 *    --- 一定期間（1年）はスキップ
 * - 読み込めたタイルには末尾に source が分かるようにしてキャッシュする eg .5a
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Libraries\GmapPolyline;

class DemController extends Controller
{

    private static $dem_source = [
        ['name' => '5a', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png"],
        ['name' => '5b', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5b_png/{z}/{x}/{y}.png"],
        ['name' => '5c', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png"],
        ['name' => '10b', 'zoom' => 14, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png"],
        ['name' => 'aster', 'zoom' => 12, 'url' => "https://tiles.gsj.jp/tiles/elev/astergdemv3/{z}/{y}/{x}.png"],  // {y}/{x} が入れ替わっている
    ];

    public function getAlt(Request $request)
    {
        $query = $request->query();
        if (!array_key_exists('lat', $query) || !array_key_exists('lng', $query)) {
            throw new Exception('クエリパラメーターがありません.');
        }
        $lat = (float) $query['lat'];
        $lng = (float) $query['lng'];
        if (abs($lat > 84) || abs($lng) >= 180) {
            throw new Exception('パラメータの範囲が不適切です.');
        }

        return self::singleAlt($lat, $lng);
    }

    private function deg2rad($deg)
    {
        return ($deg / 180) * pi();
    }

    private function rad2deg($rad)
    {
        return (180 * $rad) / pi();
    }

    /**
     * 標高データ獲得用にあらかじめタイルを読み込んでおく
     * サーバー負荷対策： getTilePath() で サーバー呼び出しのたびに 250ms、各ポイント キャッシュされてなければ 500ms
     */
    public function cacheDemTiles(Request $request)
    {
        $points = $request->input('points');

        $download_tiles = [];
        $cached_tiles = [];
        $na_points = [];

        foreach ($points as $point) {
            try {
                $result = self::singleAlt($point['lat'], $point['lng']);
                if ($result['cached'] === true) {
                    $cached_tiles[] = $result['path'];
                } else {
                    $download_tiles[] = $result['path'];
                    usleep(500_000);
                }
            } catch (Exception $e) {
                $na_points[] = $point;
            }
        }

        $download_count = count(array_unique($download_tiles, SORT_STRING));
        $cached_count = count($cached_tiles);
        $na_count = count($na_points);

        return ['download' => $download_count, 'cached' => $cached_count, 'na_points' => $na_count];
    }
    // 複数箇所の標高を取得
    // encodedPathAlt を取得して、encodedPathAlt を返す
    // 取得できなかったところは別に index の配列として返す
    public function getMultiAlt(Request $request)
    {
        $encoded = $request->encoded;
        $decoded = GmapPolyline::decodeValue($encoded);

        $errors = [];

        $path = new GmapPolyline();

        foreach ($decoded as $index => $point) {
            try {
                $lat = $point['x'];
                $lng = $point['y'];
                $dem = self::singleAlt($lat, $lng);
                $path->addPoint($lat, $lng, $dem['alt']);
            } catch (Exception $e) {
                // 取得失敗のときはそのまま返して error にインデックスを記録
                $path->addPoint($point['x'], $point['y'], $point['a']);
                array_push($errors, $index);
            }
        }

        return ['path' => $path->encodedString(), 'errors' => $errors];
    }

    /**
     * URL のパラメーター置換
     * 
     * @return string 置換したURL
     */
    private function replace_placeholder(string $str, int $x, int $y, int $z)
    {
        return str_replace(["{x}", "{y}", "{z}"], [$x, $y, $z], $str);
    }

    /**
     * 一点の標高を取得
     * 
     * @param float $lat
     * @param float $lng
     * @return array{ alt:float, dem:string, cached:boolean, lat:float, lng:float }
     * @throws Exception いずれのソースからもデータが取得できないとき
     */
    private function singleAlt($lat, $lng)
    {

        foreach (self::$dem_source as $dem) {
            $coord = self::tilePixel($lat, $lng, $dem['zoom']);
            try {
                $png_file = self::getTilePath($dem['url'], $dem['name'], $coord['tile_x'], $coord['tile_y'], $dem['zoom']);
                $png = imagecreatefrompng($png_file['path']);
                $rgb = imagecolorat($png, $coord['pixel_x'], $coord['pixel_y']);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $x = $r * 0xFFFF + $g * 0xFF + $b;
                $h = 0;
                if ($r === 128 && $g === 0 && $b === 0) {
                    continue;
                }
                if ($x < 0x80_00_00) {
                    $h = $x * 0.01;
                } else if ($x === 0x80_00_00) {
                    continue;
                } else {
                    $h = ($x - 0x1_00_00_00) * 0.01;
                }
                return ['alt' => $h, 'dem' => $dem['name'], 'cached' => $png_file['cached'], 'lat' => $lat, 'lng' => $lng, 'path' => $png_file['path']];
            } catch (Exception $e) {
                continue;
            }
        }
        // source を回っていずれも取得できない場合（海上など？）
        throw new Exception("いずれのソースからもデータが得られませんでした.");
    }

    /**
     * タイルの取得・キャッシュ
     * 　タイル画像そのものを返すのではなくストレージ上のパス名を返す
     * 　ファイルが取得できないときは .na suffix をつけて保存（expire の期間あり）
     * @param string $base_url 取得するタイルサーバーの URL（プレースホルダー）
     * @param string $name タイルサーバーの略称（ファイルの suffix にも使用）
     * @param int $x タイル座標 x
     * @param int $y タイル座標 y
     * @param int $z ズーム値
     * @return array{path: string, cached:boolean}
     * @throws Exception ファイルが得られなかったとき
     */
    private function getTilePath($base_url, $name, $x, $y, $z)
    {
        $url = self::replace_placeholder($base_url, $x, $y, $z);
        $local = self::replace_placeholder("dem/{z}/{x}/{y}.png." . $name, $x, $y, $z);
        if (Storage::exists($local . ".na")) {
            $ts = (int) trim(file_get_contents($local . ".na"));
            if (time() > $ts + 365 * 24 * 3600) {    // 前回取得より 1年以上経過 していれば再度チャレンジしてみる
                Storage::delete($local . ".na");
            } else {
                throw new \Exception('N/A');
            }
        }
        if (Storage::exists($local)) {
            return ['path' => Storage::path($local), 'cached' => true];
        }

        try {
            usleep(250_000);    // サーバーの負荷軽減
            $png = file_get_contents($url);
            Storage::put($local, $png);
            return ['path' => Storage::path($local), 'cached' => false];
        } catch (Exception $e) {
            Storage::put($local . ".na", time());
            throw new \Exception('N/A');
        };
    }
    /**
     * タイル座標・タイル内座標を返す
     * @return array{tile_x: int, tile_y: int, pixel_x: int, pixel_y: int} タイル座標(x, y) および タイル内座標(x, y)
     */
    private function tilePixel(float $latDeg,  float $lngDeg, int $zoom)
    {
        $worldCoord = self::worldCoord($latDeg, $lngDeg, $zoom);
        $tile_x = floor($worldCoord['x'] / 256);
        $tile_y = floor($worldCoord['y'] / 256);
        $pix_x = $worldCoord['x'] % 256;
        $pix_y = $worldCoord['y'] % 256;

        return ['tile_x' => $tile_x, 'tile_y' => $tile_y, 'pixel_x' => $pix_x, 'pixel_y' => $pix_y];
    }
    /**
     * 世界座標を返す
     * @return array{x: int, y:int} 世界座標（四捨五入）
     */
    private function worldCoord(float $latDeg, float $lngDeg, int $zoom = 15)
    {
        $R = 128.0 / pi();

        $lat = self::deg2rad($latDeg);
        $lng = self::deg2rad($lngDeg);

        $x = $R * ($lng + pi()) * pow(2, $zoom);
        $y = (- ($R / 2) * log((1 + sin($lat)) / (1 - sin($lat))) + 128) * pow(2, $zoom);

        return ['x' => round($x), 'y' => round($y)];
    }
}
