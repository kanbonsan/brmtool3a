<?php

/**
 * 国土地理院 標高タイルを用いて標高値を得る API
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\Request;
use Ramsey\Uuid\Type\Integer;
use Illuminate\Support\Facades\Storage;

class DemController extends Controller
{

    public function altitude ( Request $request ){

    }

    private function deg2rad($deg)
    {
        return ($deg / 180) * pi();
    }

    private function rad2deg($rad)
    {
        return (180 * $rad) / pi();
    }

    private function replace_placeholder($str, $x, $y, $z)
    {
        return str_replace(["{x}", "{y}", "{z}"], [$x, $y, $z], $str);
    }

    public function test()
    {
        return self::getAlt(27.988015973527055,86.9251820047539);
    }

    public function getAlt($lat, $lng)
    {
        $dem_source = [
            ['name' => '5a', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png"],
            ['name' => '5b', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5b_png/{z}/{x}/{y}.png"],
            ['name' => '5c', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png"],
            ['name' => '10b', 'zoom' => 14, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png"],
            ['name' => 'aster', 'zoom' => 12, 'url' => "https://tiles.gsj.jp/tiles/elev/astergdemv3/{z}/{y}/{x}.png"],
        ];
        foreach ($dem_source as $dem) {
            $coord = self::tilePixel($lat, $lng, $dem['zoom']);
            try {
                $png_file = self::getTilePath($dem['url'], $dem['name'], $coord['tile_x'], $coord['tile_y'], $dem['zoom']);
                $png = imagecreatefrompng($png_file);
                $rgb = imagecolorat($png, $coord['pixel_x'], $coord['pixel_y']);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                if ($r === 128 && $g === 0 && $b === 0) {   // ファイルはあるが、標高値が無効
                    continue;
                }
                return ['alt' => ($r * 256 * 256 + $g * 256 + $b) * 0.01, 'dem' => $dem['name']];
            } catch (Exception $e) {
                continue;
            }
        }

        return ['alt' => -9999, 'dem' => "n/a"];
    }


    public function getTilePath($base_url, $name, $x, $y, $z)
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
            return Storage::path($local);
        }

        try {
            $png = file_get_contents($url);
            Storage::put($local, $png);
            return Storage::path($local);
        } catch (Exception $e) {
            Storage::put($local . ".na", time());
            throw new \Exception('N/A');
        };
    }

    private function tilePixel($latDeg,  $lngDeg, $zoom = 15)
    {
        $worldCoord = self::worldCoord($latDeg, $lngDeg, $zoom);
        $tile_x = floor($worldCoord['x'] / 256);
        $tile_y = floor($worldCoord['y'] / 256);
        $pix_x = $worldCoord['x'] % 256;
        $pix_y = $worldCoord['y'] % 256;

        return ['tile_x' => $tile_x, 'tile_y' => $tile_y, 'pixel_x' => $pix_x, 'pixel_y' => $pix_y];
    }
    /**
     * 
     */
    private function worldCoord(float $latDeg, float $lngDeg, $zoom = 15)
    {
        $R = 128.0 / pi();

        $lat = self::deg2rad($latDeg);
        $lng = self::deg2rad($lngDeg);

        $x = $R * ($lng + pi()) * pow(2, $zoom);
        $y = (- ($R / 2) * log((1 + sin($lat)) / (1 - sin($lat))) + 128) * pow(2, $zoom);

        return ['x' => round($x), 'y' => round($y)];
    }
}
