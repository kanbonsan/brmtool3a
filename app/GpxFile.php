<?php

namespace App;
class GpxFile
{

    public $gpx;

    public function __construct()
    {
        $this->gpx = new \DOMDocument('1.0', 'UTF-8');
        $this->gpx->formatOutput = true;
        $gpx_body = new \DOMElement('gpx');
        $this->gpx->appendChild($gpx_body);
        $gpx_body->setAttribute('version', '1.1');
        $gpx_body->setAttribute('creator', 'BRMTOOL2 by Shuichi Tanaka');
        $gpx_body->setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        $gpx_body->setAttribute('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd');
    }

    public function add_waypoint($lat, $lon, $name, $sym, $ele, $time, $cmt)
    {
        $wpt = new \DOMElement('wpt');
        $gpx_body = $this->gpx->getElementsByTagName('gpx')->item(0);
        $gpx_body->appendChild($wpt);
        $wpt->setAttribute('lat', $lat);
        $wpt->setAttribute('lon', $lon);
        $wpt->appendChild(new \DOMElement('ele', $ele ?? 0));
        // $wpt->appendChild(new \DOMElement('time', $time ?? ''));
        $wpt->appendChild(new \DOMElement('name', $name ?? 'POI'));
        $wpt->appendChild(new \DOMElement('cmt', $cmt ?? ''));
        $wpt->appendChild(new \DOMElement('sym', $sym ?? 'Flag, Blue'));
    }

    public function add_track($name, $points)
    {
        $trk = new \DOMElement('trk');
        $gpx_body = $this->gpx->getElementsByTagName('gpx')->item(0);
        $gpx_body->appendChild($trk);
        $trk->appendChild(new \DOMElement('name', $name));
        $seg = new \DOMElement('trkseg');
        $trk->appendChild($seg);
        foreach ($points as $p) {
            $trkpt = new \DOMElement('trkpt');
            $seg->appendChild($trkpt);
            $trkpt->setAttribute('lat', $p['lat']);
            $trkpt->setAttribute('lon', $p['lng']);
            $trkpt->appendChild(new \DOMElement('ele', $p['ele']));
            $trkpt->appendChild(new \DOMElement('time', $p['time']));
        }
    }

    public function saveXML()
    {
        return $this->gpx->saveXML();
    }


    
}
