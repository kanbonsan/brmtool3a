<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\GpxFile;

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

        switch (strtolower($filePath['extension'])) {

            case "gpx":
                return self::upload_gpx($content);
                break;

            case "brm":
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

    // BRM ファイルのダウンロード処理（V1/V2 形式・圧縮/非圧縮 に対応）
    public function download_brmfile(Request $request){
        $version = $request->version;
        $compress = $request->compress;
        $data = $version === 1 ? self::conv_v2_to_v1_data($request->data) : $request->data;

        return $compress ? gzencode(json_encode($data, JSON_UNESCAPED_UNICODE)) : $data;

    }



    // アップロードされた brm ファイルの解析（そのまま）
    public static function upload_brm($_data)
    {
        $data = json_decode($_data);
        if (isset($data->app) && $data->app === 'brmtool' && $data->version === '2.0') {
            return ['status' => 'ok', 'app' => $data->app, 'version' => $data->version, 'type' => 'brm', 'brmData' => $data];
        } else {    // BRMTOOL ver 1 を想定
            try {
                return ['status' => 'ok', 'app' => 'brmtool', 'version' => '1.0', 'type' => 'brm', 'brmData' => self::conv_v1_to_v2_data($data)];
            } catch (\Exception $e) {
                return ['status' => 'error', 'message' => $e->getMessage()];
            }
        }
    }
    // BRMTOOL v1 データを変換
    public static function conv_v1_to_v2_data($data)
    {

        // $brm --- encodedPath, showVoluntary<array>, excluded<array>
        $_exclude = $data->exclude ?? []; // 除外区間; 除外区間の配列; <{begin, end}> で両端は含まない.
        $_points = $data->points ?? [];   // ポイントの配列; その中にキュー情報も含まれる.
        $_length = count($_points);
        $_id = $data->id ?? null;   // id は引き継がせる

        // 返す方のデータ
        $brm_excluded = [];
        $brm_showVoluntary = [];    // ver 1 では showVoluntary を分けていないので、とりあえず cue のあるところだけ true にしておく
        $pois = [];

        // excluded
        foreach ($_exclude as $ex) {  // 両端は含まない
            for ($i = $ex->begin + 1; $i < $ex->end; $i++) {
                array_push($brm_excluded, $i);
            }
        }

        // ポイントの検索
        for ($index = 0; $index < $_length; $index++) {
            if ($_points[$index]->cue !== false) {
                $_cue = $_points[$index]->cue;
                array_push($brm_showVoluntary, $index);
                array_push($pois, self::conv_v1_to_v2_poi($_cue, $index));
            }
        }

        // BRM info
        $brm_info['id'] = $_id;
        $brm_info['title'] = $data->brmName ?? '';
        $brm_info['brmDistance'] = isset($data->brmDistance) ? $data->brmDistance . 'km' : '';
        $brm_info['brmDate'] = isset($data->brmDate) ? gmdate('Y-m-d\TH:i:s.v\Z', strtotime($data->brmDate)) : '';
        $brm_info['brmStart'] = $data->brmStartTime ?? [];

        $brm = ['encodedPath' => $data->encodedPathAlt, 'showVoluntary' => $brm_showVoluntary, 'excluded' => $brm_excluded];

        return ['brmInfo' => $brm_info, 'brm' => $brm, 'pois' => $pois];
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

        $v2_pois = $v2['pois'];
        $v2_pois_list = [];
        foreach ($v2_pois as $poi) {
            $v2_pois_list[$poi['attachedPointIndex']] = $poi;
        }
        $v2_pois_index_list = array_keys($v2_pois_list);

        $v1_id = $v2_brmInfo['id'];
        $v1_brmName = $v2_brmInfo['title'];
        $v1_brmDistance = (int)preg_replace('/km/', '', $v2_brmInfo['brmDistance']);
        $v1_encodedPathAlt = $v2_encodedPath;
        $v1_brmDate = date('Y/m/d', $v2_brmDate_ts/1000);
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
            'route' => $_props['route'] ? $_props['route'] :'',
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
    // v2 はインデックスの羅列（両端を含まない）、v2 は各チャンクの begin, end の配列（両端）
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

    public function v1out(Request $request)
    {
        return self::conv_v2_to_v1_data($request->data);
    }
}
