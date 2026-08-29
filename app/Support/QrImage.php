<?php

namespace App\Support;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\Writer\SvgWriter;

/**
 * Renders a token as an SVG QR code.
 *
 * SVG rather than PNG so it stays sharp when printed and needs no image
 * extension at runtime.
 */
class QrImage
{
    public static function svg(string $data, int $size = 320): string
    {
        $result = (new Builder(
            writer: new SvgWriter(),
            data: $data,
            // Medium correction so a scuffed or partly smudged printout still
            // scans, without inflating the code too much.
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: $size,
            margin: 12,
        ))->build();

        return $result->getString();
    }
}
