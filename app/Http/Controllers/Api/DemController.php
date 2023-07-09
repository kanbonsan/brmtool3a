<?php

/**
 * 国土地理院 標高タイルを用いて標高値を得る API
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Ramsey\Uuid\Type\Integer;
use Illuminate\Support\Facades\Storage;

class DemController extends Controller
{

    private $dem = [
        ['name' => '5a', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/{z}/{x}/{y}.png"],
        ['name' => '5b', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5b_png/{z}/{x}/{y}.png"],
        ['name' => '5c', 'zoom' => 15, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem5c_png/{z}/{x}/{y}.png"],
        ['name' => '10b', 'zoom' => 14, 'url' => "https://cyberjapandata.gsi.go.jp/xyz/dem_png/{z}/{x}/{y}.png"],
        ['name' => 'aster', 'zoom' => 12, 'url' => "https://tiles.gsj.jp/tiles/elev/astergdemv3/{z}/{y}/{x}.png"],
    ];

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

    public function getAlt()
    {
        return self::getDemTile(34.38387264971507, 136.12590872583758, 14);
    }

    public function getDemTile(float $latDeg, float $lngDeg, $zoom = 15)
    {

        $coord = self::tilePixel($latDeg, $lngDeg, $zoom);
        $x = $coord['tile_x'];
        $y = $coord['tile_y'];
        $file = sprintf("%d/%d/%d.png", $zoom, $x, $y);
        $tile = "dem/" . $file;
        if (!Storage::exists($tile)) {
            $url = "https://cyberjapandata.gsi.go.jp/xyz/dem_png/" . $file;
            //$url = "https://tiles.gsj.jp/tiles/elev/astergdemv3/" . $file;
            $png = file_get_contents($url);
            Storage::put($tile, $png);
        }
        $path = Storage::path($tile);
        $png = imagecreatefrompng($path);
        $rgb = imagecolorat($png, $coord['pixel_x'], $coord['pixel_y']);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        $alt = ($r * pow(2, 16) + $g * pow(2, 8) + $b) * 0.01;
        return [$r, $g, $b, $alt];
    }

    private function tilePixel(float $latDeg, float $lngDeg, $zoom = 15)
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
