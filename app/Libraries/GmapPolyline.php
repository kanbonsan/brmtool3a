<?php

namespace App\Libraries;
/*!
 * PHP Polyline Encoder / Decoder
 * 
 */

class GmapPolyline
{

    private $points;
    private $encoded;

    public function __construct()
    {
        $this->points = array();
    }

    /**
     * Add a point
     * 
     * @param float $lat : lattitude
     * @param float $lng : longitude
     * @param float $alt : altitude
     */
    function addPoint($lat, $lng, $alt = 0.0)
    {
        if (empty($this->points)) {
            $this->points[] = array('x' => $lat, 'y' => $lng, 'a' => $alt);
            $this->encoded = $this->encodeValue($lat, 5) . $this->encodeValue($lng, 5) . $this->encodeValue($alt, 3);
        } else {
            $n = count($this->points);
            $prev_p = $this->points[$n - 1];
            $this->points[] = array('x' => $lat, 'y' => $lng, 'a' => $alt);
            $this->encoded .= $this->encodeValue($lat - $prev_p['x'], 5) . $this->encodeValue($lng - $prev_p['y'], 5) . $this->encodeValue($alt - $prev_p['a'], 3);
        }
    }

    /**
     * Return the encoded string generated from the points 
     * 
     * @return string 
     */
    function encodedString()
    {
        return $this->encoded;
    }

    /**
     * Encode a value following Google Maps API v3 algorithm
     * 
     * @param type $value
     * @return type 
     */
    function encodeValue($src, $pow)
    {
        $encoded = "";
        $value = round($src * pow(10, $pow));
        $r = ($value < 0) ? ~($value << 1) : ($value << 1);

        while ($r >= 0x20) {
            $val = (0x20 | ($r & 0x1f)) + 63;
            $encoded .= chr($val);
            $r >>= 5;
        }
        $lastVal = $r + 63;
        $encoded .= chr($lastVal);
        return $encoded;
    }

    /**
     * Decode an encoded polyline string to an array of points
     * 
     * @param string $value
     * @return array
     */
    static public function decodeValue($value)
    {
        $index = 0;
        $points = array();
        $lat = 0;
        $lng = 0;
        $alt = 0;

        while ($index < strlen($value)) {
            $b = 0;
            $shift = 0;
            $result = 0;
            do {
                $b = ord(substr($value, $index++, 1)) - 63;
                $result |= ($b & 0x1f) << $shift;
                $shift += 5;
            } while ($b > 31);
            $dlat = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lat += $dlat;

            $shift = 0;
            $result = 0;
            do {
                $b = ord(substr($value, $index++, 1)) - 63;
                $result |= ($b & 0x1f) << $shift;
                $shift += 5;
            } while ($b > 31);
            $dlng = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $lng += $dlng;

            $shift = 0;
            $result = 0;
            do {
                $b = ord(substr($value, $index++, 1)) - 63;
                $result |= ($b & 0x1f) << $shift;
                $shift += 5;
            } while ($b > 31);
            $dalt = (($result & 1) ? ~($result >> 1) : ($result >> 1));
            $alt += $dalt;

            $points[] = array('x' => $lat / 100000, 'y' => $lng / 100000, 'a' => $alt / 1000);
        }

        return $points;
    }
}
