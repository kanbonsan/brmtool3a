<?php
// Tool 2 より移動
// brmfile のバージョンを 3.0 にする

/**
 * ブルベファイルの方針（3.0作成時版）
 * ・ver 1 は残す. 
 * ・ver 1形式での保存は残す.
 * ・ver 2.0 形式は廃止
 * ・BRMTOOL2 の開発は中止.
 * ・BRMTOOL3 は 3.0形式と1.0形式の保存
 * ・ver 3.0 は BRMTOOL3 の snapshot をそのまま JSON に固めたもの
 * ・ver 3.0 から ver 1.0 のコンバートは本APIで対応
 * ・ver 1.0 ⇔ ver 3.0 の相互コンバートを実装
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\GpxFile;
use Carbon\Carbon;

class FileController extends Controller
{
    // BRMデータのアップロード（キューシートのアップロードは別コントローラーで）
    // .gpx トラック、.brm, .brz ファイル
    // 
    public function upload(Request $request)
    {

        $file = $request->file('file');
        $filePath = pathinfo($file->getClientOriginalName());
        $content = file_get_contents($file->getRealPath());

        // ファイルの中身をチェックするなら下の PHPクラス を用いるべし
        // $finfo = new \finfo();
        // $type =  $finfo->buffer($content);

        switch (strtolower($filePath['extension'])) {

            case "gpx":
                return self::upload_gpx($content);
                break;

            case "brm":
            case "brm3":
                return self::upload_brm($content);
                break;

            case "brz":
            case "gz":
                return self::upload_brm(gzdecode($content));
                break;

            default:
                throw new \Exception('ファイル形式が正しくありません.');
        }
    }


    // アップロードされた GPXファイルを解析してポイントデータを返す.
    // gpx track, gpx route どちらにも対応（gpx route の方は検証が十分でない）
    public static function upload_gpx($data)
    {

        try {
            $gpxObj = simplexml_load_string($data);
        } catch (\Exception $e) {
            throw new \Exception('File does not contain any GPX (XML).');
        }

        $track = array();
        if (isset($gpxObj->trk)) {
            foreach ($gpxObj->trk as $_track) {
                foreach ($_track->trkseg->trkpt as $p) {
                    $track[] = array(
                        'lat' => (string) $p['lat'],
                        'lng' => (string) $p['lon'],
                        'alt' => (string) $p->ele,
                        'datetime' => (string) $p->time,
                    );
                }
            }
        }
        if (isset($gpxObj->rte)) {
            foreach ($gpxObj->rte->rtept as $p) {
                $track[] = array(
                    'lat' => (string) $p['lat'],
                    'lng' => (string) $p['lon'],
                    'alt' => (string) $p->ele,
                    'datetime' => (string) $p->time,
                );
            }
        }
        if (count($track) === 0) {
            throw new \Exception('File does not contain any track points.');
        }

        return ['status' => 'ok', 'type' => 'track', 'track' => $track];
    }

    // アップロードされた brm ファイルの解析（そのまま）
    /**
     * Return
     *  'status' => 'ok' | 'error'
     *  'app' => 'brmtool'
     *  'version' => '1.0' | '3.0'
     *  'type' => 'brm'
     *  'brmData' => DATA
     */
    public static function upload_brm($_data)
    {
        $data = json_decode($_data);
        if (isset($data->app) && $data->app === 'brmtool' && $data->version === '3.0') {
            return ['status' => 'ok', 'app' => $data->app, 'version' => $data->version, 'type' => 'brm', 'brmData' => $data];
        } else {    // BRMTOOL ver 1 を想定
            try {
                return ['status' => 'ok', 'app' => 'brmtool', 'version' => '3.0', 'type' => 'brm', 'brmData' => self::conv_v1_to_v3_data($data)];
            } catch (\Exception $e) {
                return ['status' => 'error', 'message' => $e->getMessage()];
            }
        }
    }

    //
    // v1 BRM Data を v3 に変換
    //
    public static function conv_v1_to_v3_data($data)
    {

        // $brm --- encodedPath, showVoluntary<array>, excluded<array>
        $v1_exclude = $data->exclude ?? []; // 除外区間; 除外区間の配列; <{begin, end}> で両端は含まない.
        $v1_points = $data->points ?? [];   // ポイントの配列; その中にキュー情報も含まれる.
        $v1_length = count($v1_points);
        $v1_id = $data->id ?? null;   // id は引き継がせる

        // 返す方のデータ
        $v3_tool = [];  // toolStore

        $v3_route = []; // routeStore
        $v3_cuesheet = []; // cuesheetStore

        // ポイント数分の配列を用意
        $v3_excluded = array_fill(0, $v1_length, 0);
        $v3_weight = array_fill(0, $v1_length, 1);

        // excluded
        foreach ($v1_exclude as $ex) {  // 両端は含まない
            for ($i = $ex->begin + 1; $i < $ex->end; $i++) {
                $v3_excluded[$i] = 1;
            }
        }

        // ポイントの検索
        for ($index = 0; $index < $v1_length; $index++) {
            if ($v1_points[$index]->cue !== false) {
                $_cue = $v1_points[$index]->cue;
                array_push($v3_cuesheet, self::conv_v1_to_v3_poi($_cue, $index));
                $v3_weight[$index] = 20;
            }
        }

        // BRM info
        // Asia/Tokyo 決め打ち。i18n 時は考えないと。
        $brm_info['id'] = (int)$v1_id;
        $brm_info['description'] = $data->brmName ?? '';
        if (isset($data->brmDistance)) {
            $brm_info['brmDistance'] = (int)$data->brmDistance;
        }
        $brm_date = isset($data->brmDate) ? new Carbon($data->brmDate, 'Asia/Tokyo') : null;

        $brm_start = isset($data->brmStartTime) ? array_map(function ($start) use ($brm_date) {
            $base_date = $brm_date === null ? new Carbon('1970-1-1 0:00:00', 'Asia/Tokyo') : $brm_date;
            $hhmm = preg_split('/:/', $start);
            return ($base_date->timestamp + (int)$hhmm[0] * 3600 + (int)$hhmm[1] * 60) * 1000;    //millisec
        }, $data->brmStartTime) : null;

        if ($brm_date) {
            $brm_info['brmDate'] = $brm_date->timestamp * 1000;  //millisec
        }

        if ($brm_start) {
            $brm_info['startTime'] = $brm_start;
        }

        $v3_tool['brmInfo'] = $brm_info;
        $v3_route['encodedPathAlt'] = $data->encodedPathAlt;
        $v3_route['pointProperties']['excluded'] = $v3_excluded;
        $v3_route['pointProperties']['weight'] = $v3_weight;

        return ['tool' => $v3_tool, 'route' => $v3_route, 'cuesheet' => $v3_cuesheet];
    }

    // Poi データの変換
    public static function conv_v1_to_v3_poi($cue, $index)
    {
        $poi = [];
        $properties = [];
        $conv_type = ['start' => 'pc', 'goal' => 'pc', 'point' => 'cue', 'pc' => 'pc', 'pass' => 'pass', 'poi' => 'poi'];


        $poi['type'] = $conv_type[$cue->type];
        if ($cue->type === 'start') {
            $poi['terminal'] = 'start';
        }
        if ($cue->type === 'goal') {
            $poi['terminal'] = 'finish';
        }
        $poi['lat'] = $cue->marker->lat;
        $poi['lng'] = $cue->marker->lng;
        $poi['routePointIndex'] = $index;
        $poi['groupNo'] = 0;  // グループなし

        $properties['signal'] = false;
        $properties['crossing'] = '';
        $properties['name'] = $cue->name ? $cue->name : '';
        $properties['direction'] = $cue->direction ? $cue->direction : '';
        $properties['route'] = $cue->route ? $cue->route : '';
        $properties['note'] = $cue->memo ? $cue->memo :  '';

        $properties['garminDeviceIcon'] = $cue->gpsIcon->symName ? $cue->gpsIcon->symName : '';
        $properties['garminDeviceText'] = $cue->gpsIcon->name ? $cue->gpsIcon->name : '';
        $properties['garminDisplay'] = $cue->visible;

        $poi['properties'] = $properties;

        return $poi;
    }



    // BRM ファイルのダウンロード処理（V1/V3 形式・圧縮/非圧縮 に対応）
    // 基本 フロント側で作成した snapshot (json) をそのまま返すだけ（内部構造には関係しない）
    public function download_brmfile(Request $request)
    {
        $version = $request->version;
        $compress = $request->compress;
        $data = $version === 1 ? self::conv_v3_to_v1_data($request->data) : $request->data;

        return $compress === true ? gzencode(json_encode($data, JSON_UNESCAPED_UNICODE)) : $data;
    }

    // BRMTOOL v1 データを変換
    public static function conv_v1_to_v2_data($data)
    {

        // $brm --- encodedPath, showVoluntary<array>, excluded<array>
        $v1_exclude = $data->exclude ?? []; // 除外区間; 除外区間の配列; <{begin, end}> で両端は含まない.
        $v1_points = $data->points ?? [];   // ポイントの配列; その中にキュー情報も含まれる.
        $v1_length = count($v1_points);
        $v1_id = $data->id ?? null;   // id は引き継がせる

        // 返す方のデータ
        $excluded_index = [];
        $brm_showVoluntary = [];    // ver 1 では showVoluntary を分けていないので、とりあえず cue のあるところだけ true にしておく
        $v3_pois = [];

        // excluded
        foreach ($v1_exclude as $ex) {  // 両端は含まない
            for ($i = $ex->begin + 1; $i < $ex->end; $i++) {
                array_push($excluded_index, $i);
            }
        }

        // ポイントの検索
        for ($index = 0; $index < $v1_length; $index++) {
            if ($v1_points[$index]->cue !== false) {
                $_cue = $v1_points[$index]->cue;
                array_push($brm_showVoluntary, $index);
                array_push($v3_pois, self::conv_v1_to_v2_poi($_cue, $index));
            }
        }

        // BRM info
        $brm_info['id'] = $v1_id;
        $brm_info['title'] = $data->brmName ?? '';
        $brm_info['brmDistance'] = isset($data->brmDistance) ? $data->brmDistance . 'km' : '';
        $brm_info['brmDate'] = isset($data->brmDate) ? gmdate('Y-m-d\TH:i:s.v\Z', strtotime($data->brmDate)) : '';
        $brm_info['brmStart'] = $data->brmStartTime ?? [];

        $brm = ['encodedPath' => $data->encodedPathAlt, 'showVoluntary' => $brm_showVoluntary, 'excluded' => $excluded_index];

        return ['brmInfo' => $brm_info, 'brm' => $brm, 'v3_pois' => $v3_pois];
    }





    // Poi データの変換
    public static function conv_v1_to_v2_poi($cue, $index)
    {
        $poi = [];
        $properties = [];
        $conv_type = ['start' => 'start', 'goal' => 'finish', 'point' => 'cue', 'pc' => 'pc', 'pass' => 'pass', 'poi' => 'poi'];

        $poi['type'] = $conv_type[$cue->type];
        $poi['attachedPointIndex'] = $index;
        $poi['fractionOfSegment'] = null;
        $poi['showOnDevice'] = $cue->visible ?? true;

        $properties['signal'] = false;
        $properties['crossing'] = 'crossing';
        $properties['name'] = $cue->name;
        $properties['route'] = $cue->route;
        $properties['note'] = $cue->memo ? $cue->memo : '';
        $properties['direction'] = $cue->direction;
        $properties['garminDeviceIcon'] = $cue->gpsIcon->symName;
        $properties['garminDeviceText'] = $cue->gpsIcon->name;

        $poi['properties'] = $properties;

        return $poi;
    }



    // BRMTOOL v2 データ → v1 変換
    // V1 形式でのセーブ用

    /**
     * Returns
     * 
     * 'id' => v2.brmInfo.id
     * 'brmName' => v2.brmInfo.title
     * 'brmDisntace' => v2.brmInfo.brmDistance の 'km'抜きのint 200|300|400|600|1000
     * 'brmDate' =>
     * 'brmStartTime' => 
     * 'brmCurrentStartTime' =>
     * 'encodedPathAlt' =>
     * 'cueLength' =>
     * 'points' => 
     * 'exclude' =>
     * 
     */
    public static function conv_v2_to_v1_data($data)
    {
        $v2 = $data;

        $v2_brm = $v2['brm'];
        $v2_brmInfo = $v2['brmInfo'];
        $v2_excluded = $v2_brm['excluded'];   // 除外区間のポイントインデックスの配列
        $v2_encodedPath = $v2_brm['encodedPath'];
        $v2_brmDate_ts = $v2_brmInfo['brmDate'];
        $v2_show_points = $v2_brm['showPoints'];
        $v2_points_count = $v2_brm['pathLength'];   // ポイント数

        $v2_pois = $v2['v3_pois'];
        $v2_pois_list = [];
        foreach ($v2_pois as $poi) {
            $v2_pois_list[$poi['attachedPointIndex']] = $poi;
        }
        $v2_pois_index_list = array_keys($v2_pois_list);

        $v1_id = $v2_brmInfo['id'];
        $v1_brmName = $v2_brmInfo['title'];
        $v1_brmDistance = (int)preg_replace('/km/', '', $v2_brmInfo['brmDistance']);
        $v1_encodedPathAlt = $v2_encodedPath;
        $v1_brmDate = date('Y/m/d', $v2_brmDate_ts / 1000);
        $v1_brmStartTime = $v2_brmInfo['brmStart'];
        $v1_brmCurrentStartTime = count($v1_brmStartTime) ? $v1_brmStartTime[0] : "";
        $v1_exclude = self::v2_exclude_to_v1_exclude($v2_excluded);

        $v1_cue_length = count($v2_pois);

        // 各ポイント処理
        $v1_points = [];
        for ($i = 0; $i < $v2_points_count; $i++) {
            $_show = in_array($i, $v2_show_points);
            $_cue = in_array($i, $v2_pois_index_list) ?
                self::conv_v2_to_v1_poi($v2_pois_list[$i]) : false;
            array_push($v1_points, [
                'show' => $_show,
                'cue' => $_cue,
                'info' => false,
                'distance' => false
            ]);
        }

        return [
            'id' => $v1_id,
            'brmName' => $v1_brmName,
            'brmDistance' => $v1_brmDistance,
            'brmDate' => $v1_brmDate,
            'brmStartTime' => $v1_brmStartTime,
            'brmCurrentStartTime' => $v1_brmCurrentStartTime,
            'encodedPathAlt' => $v1_encodedPathAlt,
            'cueLength' => $v1_cue_length,
            'points' => $v1_points,
            'exclude' => $v1_exclude,
        ];
    }

    // Poi データの変換
    public static function conv_v2_to_v1_poi($poi)
    {
        $types = [
            'cue' => 'point', 'pc' => 'pc', 'pass' => 'pass',
            'start' => 'start', 'finish' => 'goal'
        ];
        $_props = $poi['properties'];

        $_marker = ['lat' => $poi['position']['lat'], 'lng' => $poi['position']['lng']];
        $_gps_icon = [
            'name' => str_replace("_", "", $_props['garminDeviceText']),
            'sym' => '',
            'symName' => $_props['garminDeviceIcon']
        ];

        $signal = $_props['signal'] ? $_props['signal'] . ' ' : '';
        $crossing = $_props['crossing'] ? $_props['crossing'] . ' ' : '';

        return [
            'idx' => $_props['cueIndex'],
            'type' => $types[$poi['type']],   // v2 から v1 へテーブルを介して変換
            'name' => $signal . $crossing . ($_props['name'] ? $_props['name'] : ''),
            'direction' => $_props['direction'] ? $_props['direction'] : '',
            'route' => $_props['route'] ? $_props['route'] : '',
            'cuePointIdx' => $_props['cueIndex'],
            'pcNo' => false,
            'gpsIcon' => $_gps_icon,
            'memo' => $_props['note'] ? $_props['note'] : '',
            'visible' => $poi['showOnDevice'],
            'openMin' => false,
            'closeMin' => false,
            'marker' => $_marker,
        ];
    }

    // BRMTOOL v3 データ → v1 変換
    // V1 形式でのセーブ用

    /**
     * Returns
     * 
     * 'id' => v2.brmInfo.id
     * 'brmName' => v2.brmInfo.title
     * 'brmDisntace' => v2.brmInfo.brmDistance の 'km'抜きのint 200|300|400|600|1000
     * 'brmDate' =>
     * 'brmStartTime' => 
     * 'brmCurrentStartTime' =>
     * 'encodedPathAlt' =>
     * 'cueLength' =>
     * 'points' => 
     * 'exclude' =>
     * 
     */
    public static function conv_v3_to_v1_data($data)
    {
        // タイムゾーンを日本時間に決め打ち
        date_default_timezone_set('Asia/Tokyo');

        $v3 = $data;

        $v3_brmInfo = $v3['tool']['brmInfo'];
        $v3_excluded = $v3['route']['pointProperties']['excluded'];   // 除外区間のポイントインデックスの配列
        $v3_encodedPath = $v3['route']['encodedPathAlt'];
        $v3_brmDate_ts = $v3_brmInfo['brmDate'];
        $v3_points_count = count($v3_excluded);   // ポイント数

        $v3_pois = $v3['cuesheet'];

        // routePointIndex と poi を結びつけておく
        $v3_pois_table = [];
        array_walk($v3_pois, function ($poi, $key) use (&$v3_pois_table) {
            if (array_key_exists('routePointIndex', $poi)) {
                $v3_pois_table[$poi['routePointIndex']] = $poi;
            }
        });

        $v1_id = $v3_brmInfo['id'];
        $v1_brmName = $v3_brmInfo['description'] ?? "";
        $v1_brmDistance = (int)preg_replace('/km/', '', $v3_brmInfo['brmDistance']);
        $v1_encodedPathAlt = $v3_encodedPath;
        $v1_brmDate = date('Y/m/d', $v3_brmDate_ts / 1000);
        $v1_brmStartTime = array_map(function ($ts) {
            return date('H:i', $ts / 1000);
        }, $v3_brmInfo['startTime']);
        $v1_brmCurrentStartTime = count($v1_brmStartTime) ? $v1_brmStartTime[0] : "";
        $v1_exclude = self::v3_exclude_to_v1_exclude($v3_excluded);
        $v1_cue_length = count($v3_pois);

        // 各ポイント処理
        $v1_points = [];
        for ($i = 0; $i < $v3_points_count; $i++) {
            $_show = false;
            $_cue = false;
            if (array_key_exists($i, $v3_pois_table)) {
                $_show = true;
                $_cue = self::conv_v3_to_v1_poi($v3_pois_table[$i]);
            }
            array_push($v1_points, [
                'show' => $_show,
                'cue' => $_cue,
                'info' => false,
                'distance' => false
            ]);
        }

        return [
            'id' => $v1_id,
            'brmName' => $v1_brmName,
            'brmDistance' => $v1_brmDistance,
            'brmDate' => $v1_brmDate,
            'brmStartTime' => $v1_brmStartTime,
            'brmCurrentStartTime' => $v1_brmCurrentStartTime,
            'encodedPathAlt' => $v1_encodedPathAlt,
            'cueLength' => $v1_cue_length,
            'points' => $v1_points,
            'exclude' => $v1_exclude,
        ];
    }

    // Poi データの変換
    public static function conv_v3_to_v1_poi($poi)
    {
        $types = [
            'cue' => 'point', 'pc' => 'pc', 'pass' => 'pass',
            'start' => 'start', 'finish' => 'goal'
        ];
        $_props = $poi['properties'];

        $_marker = ['lat' => $poi['position']['lat'], 'lng' => $poi['position']['lng']];
        $_gps_icon = [
            'name' => str_replace("_", "", $_props['garminDeviceText']),
            'sym' => '',
            'symName' => $_props['garminDeviceIcon']
        ];

        $signal = $_props['signal'] ? $_props['signal'] . ' ' : '';
        $crossing = $_props['crossing'] ? $_props['crossing'] . ' ' : '';

        return [
            'idx' => $_props['cueIndex'],
            'type' => $types[$poi['type']],   // v2 から v1 へテーブルを介して変換
            'name' => $signal . $crossing . ($_props['name'] ? $_props['name'] : ''),
            'direction' => $_props['direction'] ? $_props['direction'] : '',
            'route' => $_props['route'] ? $_props['route'] : '',
            'cuePointIdx' => $_props['cueIndex'],
            'pcNo' => false,
            'gpsIcon' => $_gps_icon,
            'memo' => $_props['note'] ? $_props['note'] : '',
            'visible' => $poi['showOnDevice'],
            'openMin' => false,
            'closeMin' => false,
            'marker' => $_marker,
        ];
    }

    // brm ファイルのダウンロード（default で gzip 圧縮を行う）
    public function brzFile(Request $request)
    {
        return gzencode(json_encode($request->data, JSON_UNESCAPED_UNICODE));
    }

    // brm ファイルのダウンロード（default で gzip 圧縮を行う）
    public function brmFile(Request $request)
    {
        return $request->data;
    }


    // v2 の除外リストを v1 の除外リストに変換
    // v2 はインデックスの羅列（両端を含まない）、v1 は各チャンクの begin, end の配列（両端）
    public static function v2_exclude_to_v1_exclude($arr)
    {
        sort($arr, SORT_NUMERIC);
        $len = count($arr);

        if ($len === 0) {
            return [];
        }
        $v1_exclude = [];

        $prevExIdx = null;
        $beginIdx = null;
        for ($i = 0; $i < $len; $i++) {
            $currentExIdx = $arr[$i];
            if ($prevExIdx === null) {
                $beginIdx = $currentExIdx - 1;
                $prevExIdx = $currentExIdx;
            } else if ($prevExIdx + 1 === $currentExIdx) {  // 連続
                $prevExIdx = $currentExIdx;
            } else {    // 次のチャンク
                array_push($v1_exclude, ['begin' => $beginIdx, 'end' => $prevExIdx + 1]);
                $beginIdx = $currentExIdx - 1;
                $prevExIdx = $currentExIdx;
            }
        }
        array_push($v1_exclude, ['begin' => $beginIdx, 'end' => $prevExIdx + 1]);  // 最後のチャンク

        return $v1_exclude;
    }
    // v3 の除外リストを v1 の除外リストに変換
    // v3 は 0,1 の羅列 length = ポイント数
    // v2 形式の配列にして v2→v1 に変換する
    public static function v3_exclude_to_v1_exclude($arr)
    {
        $v2_array = [];
        $len = count($arr);
        for ($i = 0; $i < $len; $i++) {
            if ($arr[$i] === 1) {
                array_push($v2_array, $i);
            }
        }
        $_v1_array = self::v2_exclude_to_v1_exclude($v2_array);   // 両端を含む場合は begin/end に両端を越えた値が入っていることがありえる
        $v1_array = array_map(function (array $ex) use ($len) {
            return ['begin' => max(0, $ex['begin']), 'end' => min($ex['end'], $len - 1)];
        }, $_v1_array);

        return $v1_array;
    }


    public function v1out(Request $request)
    {
        return self::conv_v2_to_v1_data($request->data);
    }
}
