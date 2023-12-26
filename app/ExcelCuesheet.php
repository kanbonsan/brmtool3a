<?php

namespace App;

/**
 * Excel キューシートを作成して tmp dir に save 後ファイルパスを返す
 * 
 * Excelファイルは内部にタイムゾーンの情報を保持しない。
 * 本プログラム内の計算は 'Asia/Tokyo' (GMT+9) を付与してタイムスタンプ(UTC)を算出し、
 * PhpOffice\PhpSpreadsheet\Spreadsheet_Shared_Date::PHPToExcel() メソッドの2番目の引数を true として、値が
 * UTC であることを指定して、3番目の引数で'Asia/Tokyo'を与えることで元のTZに書き戻している。
 * つまり、TZが異なっても、現地時間を指定すればその値のエクセルファイルが得られる。
 *
 * 2020/8/8 PhpExcel から PhpSpreadsheet に移行
 * 　migration ツールを使ったが今一つで手動で治す箇所多し。
 * 　col/row が 1 始まりになったよう。ここで悩む。
 * 
 * @author Shuichi Tanaka
 */

use \PhpOffice\PhpSpreadsheet\Spreadsheet;
use \PhpOffice\PhpSpreadsheet\RichText\RichText;
use \PhpOffice\PhpSpreadsheet\Writer\Xlsx;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\RichText\RichText as RichTextRichText;
use stdClass;

class ExcelCuesheet
{

    /**
     * Excel キューシートを作成して tmp dir に save 後ファイルパスを返す
     * 
     * @param object $data brmtool.path.js / Path.prototype.getCuesheet() で定義
     * @return string
     * 
     * $data 
     *      distance: ブルベ距離(km) 200, 300 ...
     *      startTime: スタート時間の配列 [<'00:00'>]
     *      date: 開催日 yyyy/mm/dd の形式
     *      name: 名称
     *      cuesheet: キューシート内容 --- 配列
     *          idx: インデックスNo( 1はじまり )
     *          name: 名称（信号＋交差点＋位置名）
     *          signal: 信号
     *          crossing: 交差点
     *          direction: 進路
     *          route: ルート
     *          dist: 合計距離（メートル）
     *          alt: 標高（メートル）
     *          note: 備考
     *          openMin: PCオープン時間（分後）
     *          closeMin: PCクローズ時間（分後）
     *          type: ポイントタイプ cue, start, finish, pass
     *          
     */

    public static function make_cuesheet($data)
    {
        $columns = [

            'number' => [
                'title' => 'No.',
                'prop' => 'idx',
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => true, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 7.1429,
            ],

            'signal' => [
                'title' => '信号',
                'prop' => 'signal',
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => true, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 10,  // column width
            ],

            'crossing' => [
                'title' => '交差点',
                'prop' => 'crossing',
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => true, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 10,  // column width
            ],

            'name' => [
                'title' => '通過点',
                'func' => function($current, $prev){
                    $name = $current->name;
                    return ['value'=>self::rich_text($name)];
                },
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING,
                'width' => 22.8571,
            ],

            'direction' => [
                'title' => '進路',
                'prop' => 'direction',
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING,
                'width' => 12.8571,
            ],

            'route' => [
                'title' => 'ルート',
                'prop' => 'route',
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'wrapText' => true],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING,
                'width' => 12.8571,
            ],

            'lap' => [
                'title' => '区間距離',
                'func' => function ($current, $prev) {
                    $current_distance = round($current->dist / 1000, 1);
                    return ['value' => $current_distance === 0.0 ? 0.0 : $current_distance - round($prev->dist / 1000, 1)];
                },
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders' => [],
                    'fill' => [],
                    'numberFormat' => ['formatCode' => '0.0'],  // setFormatCode()
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 10,
            ],

            'distance' => [
                'title' => '合計距離',
                'func' => function ($current, $prev) {
                    return ['value' => round($current->dist / 1000, 1)];
                },
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders' => [],
                    'fill' => [],
                    'numberFormat' => ['formatCode' => '0.0'],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 10,
            ],

            'alt' => [
                'title' => '標高',
                'prop' => 'alt',
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders' => [],
                    'fill' => [],
                    'numberFormat' => ['formatCode' => '0'],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 10,
            ],

            'note' => [
                'title' => '備考',
                'prop' => 'note',
                'func' => function($current, $prev){
                    $note = $current->note;
                    return ['value'=>self::rich_text($note)];
                },
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'wrapText' => true, 'indent' => 1,],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING,
                'width' => 28.5714,
            ],


            'open' => [
                'title' => 'PCオープン',
                'func' => function ($current, $prev) {
                    if ($current->isBrm) {
                        $ts_open = $current->ts_start + $current->openMin * 60;
                        $day_open = (int)date('j', $ts_open);
                        $open = $current->type == 'cue' ? '' : \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel($ts_open + 3600 * 9);
                        $format = ($current->day_start == $day_open) ? 'h:mm' : 'd/ h:mm';
                        if ($current->type === 'pass') {
                            $format = "($format)";
                        }
                        return ['value' => $open, 'formatCode' => $format];
                    } else {
                        return ['value' => ''];
                    }
                },
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 22.8571,
            ],

            'close' => [
                'title' => 'PCクローズ',
                'func' => function ($current, $prev) {
                    if ($current->isBrm) {
                        switch ($current->type) {
                            case 'start':
                                $ts_close = $current->ts_start + 30 * 60;
                                break;
                            case 'finish':
                                $ts_close = $current->ts_start + $current->exp;
                                break;
                            default:
                                $ts_close = $current->ts_start + $current->closeMin * 60;
                                break;
                        }
                        $day_close = (int)date('j', $ts_close);
                        $close = $current->type === 'cue' ? '' : \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel($ts_close + 3600 * 9);
                        $format = ($current->day_start == $day_close) ? 'h:mm' : 'd/ h:mm';
                        if ($current->type === 'pass') {
                            $format = "($format)";
                        }
                        return ['value' => $close, 'formatCode' => $format];
                    } else {
                        return ['value' => ''];
                    }
                },
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => false, 'color' => ['rgb' => \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_BLACK]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER, 'indent' => 1],
                    'borders' => [],
                    'fill' => [],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC,
                'width' => 22.8571,
            ],

            'header' => [
                'styles' => [
                    'font' => ['name' => 'メイリオ', 'size' => 10, 'bold' => true, 'color' => ['argb' => 'FF006400']],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER, 'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER],
                    'borders' => [],
                    'fill' => [
                        'type' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startcolor' => ['argb' => 'FFCCFFCC']
                    ],
                ],
                'cellProperty' => \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING,
            ]

        ];

        $table_items = ['number', 'name', 'direction', 'route', 'lap', 'distance', 'note', 'open', 'close'];

        $header_props = $columns['header'];

        date_default_timezone_set('Asia/Tokyo');

        $isBrm = true;

        $expiration = [200 => 13.5, 300 => 20, 400 => 27, 600 => 40, 1000 => 75, 1200 => 90];
        if ($data->distance > 0) {
            $exp = array_key_exists($data->distance, $expiration) ? $expiration[$data->distance] * 3600 : NULL;
        } else {
            $exp = NULL;
            $isBrm &= FALSE;
        }

        if (count($data->startTime) == 0) {
            $data->startTime = ['00:00'];
            $isBrm &= FALSE;
        }

        if (!$data->date) {
            $data->date = '1970/1/1';
            $isBrm &= FALSE;
        }

        if (!$data->name) {
            $data->name = '名称未設定';
        }

        $objPhpOffice = new Spreadsheet();
        $objPhpOffice->getProperties()
            ->setCreator('BRMTOOL2 by Shuichi Tanaka')
            ->setTitle($data->name);

        foreach ($data->startTime as $shtNo => $s) {
            if ($shtNo !== 0) { // ２つ目以降
                $objPhpOffice->createSheet();
            }
            $objPhpOffice->setActiveSheetIndex($shtNo);
            $sheet = $objPhpOffice->getActiveSheet();

            $sheet->getPageSetup()->setOrientation(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::ORIENTATION_LANDSCAPE);
            $sheet->getPageSetup()->setPaperSize(\PhpOffice\PhpSpreadsheet\Worksheet\PageSetup::PAPERSIZE_A4);
            $sheet->getPageSetup()->setFitToWidth(1);
            $sheet->getPageSetup()->setFitToHeight(0);
            $sheet->getPageSetup()->setRowsToRepeatAtTopByStartAndEnd(1, 2);

            $ts_start = strtotime($data->date . ' ' . $s . '+0900');    // JST
            $day_start = (int) date('j', $ts_start);

            $_start_time = explode(':', $s);
            if ($isBrm) {
                $sheet->setTitle(sprintf('%d時%02d分', $_start_time[0], $_start_time[1]));
            } else {
                $sheet->setTitle('キューシート');
            }

            // 表題
            $row = 1;
            $sheet->setCellValueExplicitByColumnAndRow(1, $row, $data->name, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->getCellByColumnAndRow(1, $row)
                ->getStyle()->getFont()
                ->setName('メイリオ')
                ->setSize(14);
            $sheet->mergeCells("A1:F1");

            if ($isBrm) {
                $sheet->setCellValueExplicitByColumnAndRow(8, $row, \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel($ts_start + 9 * 3600), \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC);
                $sheet->getStyleByColumnAndRow(8, $row)->getFont()->setName('メイリオ');
                $sheet->getStyleByColumnAndRow(8, $row)->getNumberFormat()->setFormatCode('YYYY年M月D日 開催');
                $sheet->getStyleByColumnAndRow(8, $row)->getAlignment()->setShrinkToFit(true);
                $sheet->getStyleByColumnAndRow(8, $row)->getAlignment()->setIndent(1);

                $sheet->setCellValueExplicitByColumnAndRow(9, $row, \PhpOffice\PhpSpreadsheet\Shared\Date::PHPToExcel($ts_start + 9 * 3600), \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_NUMERIC);
                $sheet->getStyleByColumnAndRow(9, $row)->getFont()->setName('メイリオ');
                $sheet->getStyleByColumnAndRow(9, $row)->getNumberFormat()->setFormatCode('H時MM分 スタート');
                $sheet->getStyleByColumnAndRow(9, $row)->getAlignment()->setShrinkToFit(true);
                $sheet->getStyleByColumnAndRow(9, $row)->getAlignment()->setIndent(1);
            }
            // ヘッダー
            ++$row;

            foreach ($table_items as $_col => $item_name) {
                $col = $_col + 1;
                $item_property = $columns[$item_name];

                $sheet->setCellValueExplicitByColumnAndRow($col, $row, $item_property['title'], $header_props['cellProperty']);
                $sheet->getStyleByColumnAndRow($col, $row)->applyFromArray($header_props['styles']);
            }

            // 項目
            $prev = new stdClass();     // 前の行
            foreach ($data->cuesheet as $cue) {
                ++$row;

                // コールバックの中で使えるようにインスタンスにセットしておく
                $cue->ts_start = $ts_start;
                $cue->day_start = $day_start;
                $cue->exp = $exp;
                $cue->isBrm = $isBrm;

                foreach ($table_items as $_col => $item_name) {

                    $col = $_col + 1;

                    $col_props = $columns[$item_name];
                    if (!isset($col_props['func'])) {
                        $col_props['value'] = $cue->{$col_props['prop']};
                    } else {
                        $_props = $col_props['func']($cue, $prev);
                        foreach ($_props as $key => $val) {
                            $col_props[$key] = $val;
                        }
                    }

                    $value = $col_props['value'];
                    // value
                    if ($value) {
                        $sheet->setCellValueExplicitByColumnAndRow($col, $row, $value, $col_props['cellProperty']);
                    }
                    // styles
                    if (isset($col_props['styles'])) {
                        $sheet->getStyleByColumnAndRow($col, $row)->applyFromArray($col_props['styles']);
                    }
                    // formatCode
                    if (isset($col_props['formatCode'])) {
                        $sheet->getStyleByColumnAndRow($col, $row)->getNumberFormat()->setFormatCode($col_props['formatCode']);
                    }

                    // PC の塗りつぶし
                    if ($cue->type !== 'cue') {
                        $sheet->getStyleByColumnAndRow(1, $row, count($table_items), $row)
                            ->getFill()
                            ->applyFromArray(
                                [
                                    'fillType' =>
                                    \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                                    'startColor' =>
                                    ['rgb' => 'FFFF00'],
                                    'endColor' =>
                                    ['rgb' => 'FFFF00']
                                ]

                            );
                    }
                }
                $prev = $cue;
            }

            // カラム幅
            foreach ($table_items as $col => $item_name) {
                $item_property = $columns[$item_name];
                $width = $item_property['width'];
                $sheet->getColumnDimensionByColumn($col + 1)->setWidth($width);
            }

            // 罫線 ( col:0, row: 2 - col:8, row:$row )
            $sheet->getStyleByColumnAndRow(1, 2, count($table_items), $row)
                ->getBorders()
                ->applyFromArray(
                    [
                        'outline' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'FFFFFF00']],
                        'inside' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_HAIR, 'color' => ['rgb' => 'EEEEEE00']]
                    ]
                );
        }

        $temp_file_name = Str::random(16) . '.xlsx';

        $file = Storage::path($temp_file_name);
        $writer = \PhpOffice\PhpSpreadsheet\IOFactory::createWriter($objPhpOffice, "Xlsx");
        $writer->save($file);

        return $temp_file_name;
    }
    /**
     * キューシートの読み込み
     *      エクセル .xls, .xlsx オープンドキュメント .ods CSVファイルに対応（PhpOffice\PhpSpreadsheet\Spreadsheet の自動読み込みで読めるか
     *      CSV ファイルの場合は shiftJIS を UTF-8 に変換後読み込む。
     *      最終的に取り込むカラムは、$column_list の ９項目。
     *      項目行(header)を同定して、その１行後から最終行までを対象とする。
     *      累積距離が数字でなければ除外。
     * 
     *      1. ワークシートごとに処理
     *      2. 全て配列に読み込む $_data
     *      3. $columns_list の 'names' をマージしたもので全行を走査して項目行($row_header)を見つける。6つ以上合致すれば即決定。合致行がなければエラー。
     *      4. カラムの同定： 各カラム $columns_list の 0～8 かどうかを調べる。項目行で合致 +50点、データ行で合致 +1 点
     *      5. 上記スコアを元にカラムを同定していくが、カラムの重複が生じないように先に決まったらそれで決定。
     *      6. 上記の決定を元にデータを作成 $cuesheet して返す。
     *      TODO.   細かくカラムを分けたキューシートではそれらを選ばせた上でマージできるようにしたい。
     * 
     * @param String $xls_file    フルパス
     * @param String $ext CSVファイルかどうかの判定用
     * @return 
     */

    public static function read_cuesheet($xls_file, $ext = '')
    {

        $columns_list = [
            0 => [
                'names' => ['No', '番号', '№'],
                'conv' => 'asKV',
                'data' => ['[0-9]+'],
            ],
            1 => [
                'names' => ['名称', '通過点',],
                'conv' => 'asKV',
                'data' => ['S', 'T', 'Y', '[├┼┤┬┴┠┫╂┳┻]'],
            ],
            2 => [
                'names' => ['進路',],
                'conv' => 'asKV',
                'data' => ['右折', '左折', '直進'],
            ],
            3 => [
                'names' => ['ルート', 'ROUTE', '道路番号'],
                'conv' => 'asKV',
                'data' => ['R[0-9]+', 'K[0-9]+', '市道'],
            ],
            4 => [
                'names' => ['区間',],
                'conv' => 'asKV',
                'data' => ['[0-9][0-9.]*'],
            ],
            5 => [
                'names' => ['合計', '積算', '累積'],
                'conv' => 'asKV',
                'data' => ['[0-9][0-9.]*'],
            ],
            6 => [
                'names' => ['備考', '情報', 'メモ'],
                'conv' => 'asKV',
                'data' => ['.+'],
            ],
            7 => [
                'names' => ['.*開', '.*オープン',],
                'conv' => 'asKV',
                'data' => ['.*[0-9]+:[0-9][0-9]'],
            ],
            8 => [
                'names' => ['.*閉', '.*クローズ',],
                'conv' => 'asKV',
                'data' => ['.*[0-9]+:[0-9][0-9]'],
            ],
        ];
        $headers = [];
        foreach ($columns_list as $c) {
            $headers = array_merge($headers, $c['names']);
        }

        $header_reg = implode('|', $headers);

        try {
            // ファイルの読み込み
            // CSV ファイルのコンマ区切りがうまく効かずにセル内容にコンマが含まれてしまう
            if (strtolower($ext) === 'csv') {
                $buf = mb_convert_encoding(file_get_contents($xls_file), 'utf-8', ['sjis-win', 'utf-8']);
                $corrected = self::correct($buf);

                $fp = tmpfile();
                $xls_file = stream_get_meta_data($fp)['uri'];
                fwrite($fp, $corrected);

                $reader = new \PhpOffice\PhpSpreadsheet\Reader\Csv();
                $reader->setDelimiter(',');
                $reader->setEnclosure('"');
                $reader->setSheetIndex(0);
                $obj = $reader->load($xls_file);
            } else {

                $obj = \PhpOffice\PhpSpreadsheet\IOFactory::load($xls_file);
            }
        } catch (\PhpOffice\PhpSpreadsheet\Reader\Exception $e) {

            throw new \Exception('readerError' . $e->getMessage());
            //return array('status' => 'error', 'message' => $e->getMessage());
        }

        $sheetNames = $obj->getSheetNames();
        $sheetCount = count($sheetNames);
        $data = [];
        for ($i = 0; $i < $sheetCount; $i++) {

            $sheet = $obj->getSheet($i);

            $highestRowIdx = $sheet->getHighestRow();
            $highestColName = $sheet->getHighestColumn();
            $highestColIdx = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColName);

            // 全データを $_data 配列に取り込む　$_data[ row ][ col ] で row, col ともに 0 から
            $_data = [];
            for ($row = 1; $row <= $highestRowIdx; $row++) {
                $_col = [];
                $_col_sum = '';   // 空行を除く処理のため、全ての値の和が '' のときは飛ばす
                for ($col = 1; $col <= $highestColIdx; $col++) {
                    $_col_val = trim($sheet->getCellByColumnAndRow($col, $row)->getFormattedValue());
                    $_col[] = $_col_val;
                    $_col_sum .= $_col_val;
                }
                if ($_col_sum) {
                    $_data[] = $_col;
                }
            }

            // ヘッダー行を探す

            $max_match_count = 0;
            $max_match_row = -1;

            for ($row = 0, $len = count($_data); $row < $len; $row++) {
                $_row = $_data[$row];
                $_match = 0;
                foreach ($_row as $_col) {
                    $_match += (mb_ereg_match($header_reg, $_col) ? 1 : 0);
                }
                if ($_match > 5) {
                    $max_match_row = $row;
                    break;
                } else if ($_match > $max_match_count) {
                    $max_match_count = $_match;
                    $max_match_row = $row;
                }
            }
            if ($max_match_row >= 0) {
                $row_header = $max_match_row;   // ヘッダー行
            } else {
                $status = 'error';
                $message = 'header row not found';
                $data[] = array('name' => $sheetNames[$i], 'status' => $status, 'message' => $message);
                continue;
            }

            // カラムの同定
            $_cuesheet = [];
            for ($col = 0; $col < $highestColIdx; $col++) {
                // Header
                $_val = $_data[$row_header][$col];

                foreach ($columns_list as $no => $c) {
                    $_score = mb_ereg_match(implode('|', $c['names']), mb_convert_kana($_val, 'asKV')) * 50;
                    $_cuesheet[$col]['columns'][$no]['score'] = $_score;
                }
                // Data
                foreach ($columns_list as $no => $c) {
                    $_match = 0;
                    for ($row = $row_header + 1, $len = count($_data); $row < $len - $row_header; $row++) {
                        $_val = trim($_data[$row][$col]);
                        if ($_val) {
                            $_match += mb_ereg_match(implode('|', $c['data']), mb_convert_kana($_val, $c['conv'])) * 1;
                        }
                    }
                    $_cuesheet[$col]['columns'][$no]['score'] += $_match;
                }
            }
            $_list = [];  // すでに選ばれたカラムの番号（重複を避けるため）
            $col_order = [];
            foreach ($columns_list as $no => $c) {
                $_highest_score = 0;
                $_highest_col = 0;
                for ($col = 0; $col < $highestColIdx; $col++) {
                    if ($_cuesheet[$col]['columns'][$no]['score'] > $_highest_score && !in_array($col, $_list)) {
                        $_highest_score = $_cuesheet[$col]['columns'][$no]['score'];
                        $_highest_col = $col;
                    }
                }
                $_list[] = $_highest_col;
                $col_order[$no] = $_highest_col;  // カラムNo => 実際のエクセルのカラムNo
            }

            $cuesheet = [];
            $cue_row = 0;
            for ($row = $row_header + 1, $len = count($_data); $row < $len; $row++) {
                $_dist_col = $col_order[5];
                $_dist = mb_convert_kana($_data[$row][$_dist_col], $columns_list[5]['conv']);
                if (!mb_ereg_match(implode('|', $columns_list[5]['data']), $_dist)) {
                    continue;
                }
                foreach ($col_order as $no => $col) {
                    if ($col >= 0) {
                        $cuesheet[$cue_row][$no] = mb_convert_kana($_data[$row][$col], $columns_list[$no]['conv']);
                    } else {
                        $cuesheet[$cue_row][$no] = '';
                    }
                }
                $cue_row++;
            }

            $sort = [];

            // array__mutisort の使い方： 
            // 総距離でソート
            foreach ($cuesheet as $key => $val) {
                $sort[$key] = $val[5];
            }
            array_multisort($sort, SORT_ASC, $cuesheet);
            $data[] = array(
                'name' => $sheetNames[$i], 'status' => 'ok', 'cuesheet' => $cuesheet,
                'start' => $cuesheet[0][5], 'goal' => $cuesheet[count($cuesheet) - 1][5],
                //'debug' => ['corrected'=>$corrected, '_data' => $_data, 'col_order' => $col_order, '_cuesheet' => $_cuesheet]
            );
        }
        return $data;
    }

    // .csv ファイルの読み込みがうまくいかないのを正す（上記メソッドの注を参照）
    public static function correct($str)
    {

        // 改行コードを置き換えておく
        $str = str_replace("\r\n", "[CRLF]", $str);

        // セル内改行は LF で、"" で quote されるので取り除く
        $str = str_replace(array('"', "\n"), "", $str);

        $lines = explode("[CRLF]", $str);

        $output = '';
        foreach ($lines as $line) {
            $cells = explode(',', $line);
            foreach ($cells as &$cell) {
                $cell = "\"" . $cell . "\"";
            }
            $output .= implode(',', $cells) . "\n";
        }

        return $output;
    }

    // 今の所、bold と colorRed に対応
    // マークアップがない場合はテキストを出力、マークアップありのときに richtext オブジェクトにして返す
    public static function rich_text($markups)
    {
        if( count($markups)===1 && count($markups[0]['tagName'])===0){  // マークアップなし
            return $markups[0]['str'];
        } else {
            $richtext = new RichText();
            foreach( $markups as $segment){
                if(count($segment['tagName'])===0){
                    $richtext->createText($segment['str']);
                } else {
                    $markup = $richtext->createTextRun($segment['str']);
                    if( in_array( 'bold', $segment['tagName'])){
                        $markup->getFont()->setBold(true);
                    }
                    if( in_array('colorRed', $segment['tagName'])){
                        $markup->getFont()->setColor( new \PhpOffice\PhpSpreadsheet\Style\Color( \PhpOffice\PhpSpreadsheet\Style\Color::COLOR_RED ) );
                    }
                }
            }
            return $richtext;
        }
    }
}
