<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\ExcelCuesheet;

class CuesheetController extends Controller
{

    //
    public function upload(Request $request)
    {
        $file = $request->file('file');

        $tempFile = $file->path();
        $pathInfo = pathinfo($file->getClientOriginalName());
        try {
            return ExcelCuesheet::read_cuesheet($tempFile, $pathInfo['extension']);
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    public function download(Request $request)
    {
        try {
            $brm_info = $request->brmInfo;
            $cue_data = $request->cueData;

            $data = new \stdClass();
            $data->distance = (int) preg_replace("/km/", "", $brm_info['brmDistance']);
            $data->date = date('Y/m/d', (int) $brm_info['brmDate']/1000);   // date('Y/m/d', strtotime($brm_info['brmDate']));
            $data->startTime = $brm_info['brmStart'];
            $data->name = $brm_info['title'] ?? '';

            $data->cuesheet = [];
            foreach ($cue_data as $cue) {

                $_cue = new \stdClass();
                $_cue->idx = $cue['number'];
                $_cue->type = $cue['type'];
                $_cue->name = $cue['nameMarkup'] ?? '';
                $_cue->direction = $cue['direction'] ?? '';
                $_cue->route = $cue['route'] ?? '';
                $_cue->dist = $cue['distance'];
                $_cue->note = $cue['noteMarkup'] ?? '';
                $_cue->openMin = $cue['openMin'];
                $_cue->closeMin = $cue['closeMin'];

                $data->cuesheet[] = $_cue;
            }

            $file_name = ExcelCuesheet::make_cuesheet($data);

            $xls_content = Storage::get($file_name);
            Storage::delete($file_name);
            return $xls_content;
        } catch (\Exception $e) {
            throw new \Exception('キューシート作成に失敗しました.');
        }
    }
}
