<?php

return [
    // Windows example: C:\Program Files\Tesseract-OCR\tesseract.exe
    'tesseract_binary' => env('TESSERACT_BINARY', 'tesseract'),

    // Default languages; adjust to your installed traineddata.
    'tesseract_lang' => env('TESSERACT_LANG', 'fra+eng'),
];
