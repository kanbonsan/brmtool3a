<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\GpxFile;

class GpsFileExportController extends Controller
{

    public function gpxfile(Request $request)
    {
        $gpx = new GpxFile();
        $tracks = $request->input('tracks', []);
        $waypoints = $request->input('waypoints', []);

        if (count($tracks) === 0 && count($waypoints) === 0) {
            throw new \Exception('データがありません.');
        }

        // POIS
        foreach ($waypoints as $wpt) {
            $wpt_array = json_decode(json_encode($wpt), true);
            $gpx->add_waypoint(
                $wpt_array['lat'],
                $wpt_array['lng'],
                str_replace('_', '', $wpt_array['name']),    // 分かち書き用の _ を消去
                $wpt_array['sym'],
                $wpt_array['ele'],
                null,   // TIME
                $wpt_array['cmt'],
            );
        }

        // TRACKS
        foreach ($tracks as $track) {
            $track_array = json_decode(json_encode($track), true);  // Obj->Array
            $gpx->add_track($track_array['trackName'], $track_array['points']);
        }
        return $gpx->saveXML();
    }
}
