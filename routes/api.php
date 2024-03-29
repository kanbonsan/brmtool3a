<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('getAlt', 'App\Http\Controllers\Api\DemController@getAlt');
Route::post('getMultiAlt' , 'App\Http\Controllers\Api\DemController@getMultiAlt');

Route::post('cacheDemTiles', 'App\Http\Controllers\Api\DemController@cacheDemTiles');

Route::post('getMultiAlt', 'App\Http\Controllers\Api\DemController@getMultiAlt');

Route::post('upload/file', 'App\Http\Controllers\Api\FileController@upload');

Route::post('download/brmfile', 'App\Http\Controllers\Api\FileController@download_brmfile');

//Route::post('upload/gpx', 'Api\FileController@gpxupload');

Route::post('cuesheet/upload', 'Api\CuesheetController@upload');
Route::post('cuesheet/download', 'Api\CuesheetController@download');

// GPX ファイルエクスポート
Route::post('export/gpx', 'Api\GpsFileExportController@gpxfile');
