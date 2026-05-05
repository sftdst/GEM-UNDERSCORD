<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Log;

class OcrService
{
    /**
     * Extract text from a document using the best available method.
     */
    public function extractText(Document $document): ?string
    {
        $version = $document->derniereVersion;
        if (!$version) return null;

        $filePath = storage_path("app/private/{$version->chemin_stockage}");
        if (!file_exists($filePath)) return null;

        $text = null;

        try {
            // Images: Tesseract OCR uniquement
            if (in_array($document->extension, ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'gif'])) {
                $text = $this->runTesseract($filePath);
            }
            // PDF: pdftotext → smalot/pdfparser → Tesseract (si scanné)
            elseif ($document->extension === 'pdf') {
                $text = $this->extractPdfText($filePath);
                if (empty(trim($text ?? ''))) {
                    $text = $this->runTesseract($filePath, true);
                }
            }
            // Word DOCX/DOC/ODT: phpoffice/phpword → fallback ZipArchive
            elseif (in_array($document->extension, ['docx', 'doc', 'odt'])) {
                $text = $this->extractDocxText($filePath, $document->extension);
            }
            // Excel XLSX/ODS: ZipArchive (sharedStrings)
            elseif (in_array($document->extension, ['xlsx', 'ods'])) {
                $text = $this->extractXlsxText($filePath, $document->extension);
            }
            // Texte brut
            elseif (in_array($document->extension, ['txt', 'csv', 'md', 'rtf'])) {
                $raw  = file_get_contents($filePath);
                $text = $raw !== false ? $this->sanitizeToUtf8($raw) : null;
            }
        } catch (\Exception $e) {
            Log::warning("OCR extraction failed for document {$document->id}: {$e->getMessage()}");
        }

        if ($text && !empty(trim($text))) {
            $text = $this->sanitizeToUtf8($text);
            $document->update(['texte_extrait' => $text]);
            return $text;
        }

        return null;
    }

    /**
     * Ensure text is valid UTF-8 for PostgreSQL.
     */
    private function sanitizeToUtf8(string $text): string
    {
        if (mb_check_encoding($text, 'UTF-8')) {
            return $text;
        }

        $detected = mb_detect_encoding($text, ['UTF-8', 'ISO-8859-1', 'Windows-1252', 'ISO-8859-15'], true);
        if ($detected && $detected !== 'UTF-8') {
            $converted = mb_convert_encoding($text, 'UTF-8', $detected);
            if ($converted !== false) {
                return $converted;
            }
        }

        $converted = mb_convert_encoding($text, 'UTF-8', 'ISO-8859-1');
        if ($converted !== false && mb_check_encoding($converted, 'UTF-8')) {
            return $converted;
        }

        return mb_convert_encoding($text, 'UTF-8', 'UTF-8');
    }

    public function isTesseractAvailable(): bool
    {
        $check = shell_exec('tesseract --version 2>&1');
        return !empty($check) && !str_contains($check, 'not found') && !str_contains($check, 'not recognized');
    }

    private function runTesseract(string $filePath, bool $isPdf = false): ?string
    {
        if (!$this->isTesseractAvailable()) {
            Log::info('Tesseract OCR is not installed. Skipping OCR extraction.');
            return null;
        }

        $outputFile = tempnam(sys_get_temp_dir(), 'ocr_');
        $lang = 'fra+eng';

        $cmd = $isPdf
            ? sprintf('tesseract %s %s -l %s pdf 2>&1', escapeshellarg($filePath), escapeshellarg($outputFile), $lang)
            : sprintf('tesseract %s %s -l %s 2>&1', escapeshellarg($filePath), escapeshellarg($outputFile), $lang);

        exec($cmd, $output, $returnCode);

        $resultFile = $outputFile . '.txt';
        $text = null;
        if (file_exists($resultFile)) {
            $text = file_get_contents($resultFile);
            @unlink($resultFile);
        }
        @unlink($outputFile);

        return !empty(trim($text ?? '')) ? $text : null;
    }

    /**
     * Extrait le texte d'un PDF via pdftotext puis smalot/pdfparser en fallback.
     */
    private function extractPdfText(string $filePath): ?string
    {
        // 1) pdftotext (poppler)
        $check = shell_exec('pdftotext -v 2>&1');
        if (!empty($check) && !str_contains($check, 'not found') && !str_contains($check, 'not recognized')) {
            $outputFile = tempnam(sys_get_temp_dir(), 'pdf_');
            exec(sprintf('pdftotext -enc UTF-8 %s %s 2>&1', escapeshellarg($filePath), escapeshellarg($outputFile)));
            if (file_exists($outputFile)) {
                $text = file_get_contents($outputFile);
                @unlink($outputFile);
                if (!empty(trim($text))) {
                    return $text;
                }
            }
        }

        // 2) smalot/pdfparser (pure PHP, texte embarqué uniquement)
        if (class_exists(\Smalot\PdfParser\Parser::class)) {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf    = $parser->parseFile($filePath);
                $text   = $pdf->getText();
                if (!empty(trim($text))) {
                    return $text;
                }
            } catch (\Exception $e) {
                Log::info("smalot/pdfparser: {$e->getMessage()}");
            }
        }

        return null;
    }

    /**
     * Extrait le texte d'un fichier DOCX, DOC ou ODT.
     * Utilise phpoffice/phpword en priorité, puis ZipArchive en fallback.
     */
    private function extractDocxText(string $filePath, string $extension = 'docx'): ?string
    {
        // 1) phpoffice/phpword (recommandé — gère tableaux, en-têtes, etc.)
        if (class_exists(\PhpOffice\PhpWord\IOFactory::class)) {
            try {
                $readerType = match ($extension) {
                    'odt'   => 'ODText',
                    'doc'   => 'MsDoc',
                    default => 'Word2007',
                };

                $phpWord = \PhpOffice\PhpWord\IOFactory::load($filePath, $readerType);
                $parts   = [];

                foreach ($phpWord->getSections() as $section) {
                    $parts[] = $this->extractPhpWordSectionText($section);
                }

                $text = implode("\n", array_filter($parts));
                if (!empty(trim($text))) {
                    return $text;
                }
            } catch (\Exception $e) {
                Log::info("phpword extraction failed ({$extension}): {$e->getMessage()}");
            }
        }

        // 2) Fallback ZipArchive pour DOCX/ODT
        if (in_array($extension, ['docx', 'odt']) && class_exists('ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($filePath) === true) {
                $xmlFile    = ($extension === 'odt') ? 'content.xml' : 'word/document.xml';
                $xmlContent = $zip->getFromName($xmlFile);
                $zip->close();

                if ($xmlContent !== false) {
                    if ($extension === 'odt') {
                        preg_match_all('/<text:(?:p|h|span)[^>]*>(.*?)<\/text:(?:p|h|span)>/s', $xmlContent, $matches);
                    } else {
                        preg_match_all('/<w:t[^>]*>(.*?)<\/w:t>/s', $xmlContent, $matches);
                    }

                    if (!empty($matches[1])) {
                        $text = implode(' ', array_map(
                            fn($t) => html_entity_decode(strip_tags($t), ENT_QUOTES | ENT_XML1, 'UTF-8'),
                            $matches[1]
                        ));
                        $text = preg_replace('/[ \t]+/', ' ', $text);
                        $text = preg_replace('/(\s*\n\s*){3,}/', "\n\n", trim($text));
                        if (!empty(trim($text))) {
                            return $text;
                        }
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extrait récursivement le texte d'une section phpoffice/phpword.
     */
    private function extractPhpWordSectionText(\PhpOffice\PhpWord\Element\AbstractContainer $container): string
    {
        $parts = [];
        foreach ($container->getElements() as $element) {
            if ($element instanceof \PhpOffice\PhpWord\Element\Text) {
                $parts[] = $element->getText();
            } elseif ($element instanceof \PhpOffice\PhpWord\Element\TextRun) {
                $parts[] = $this->extractPhpWordSectionText($element);
            } elseif ($element instanceof \PhpOffice\PhpWord\Element\Table) {
                foreach ($element->getRows() as $row) {
                    $rowParts = [];
                    foreach ($row->getCells() as $cell) {
                        $cellText = $this->extractPhpWordSectionText($cell);
                        if (!empty(trim($cellText))) {
                            $rowParts[] = $cellText;
                        }
                    }
                    if (!empty($rowParts)) {
                        $parts[] = implode(' | ', $rowParts);
                    }
                }
            } elseif ($element instanceof \PhpOffice\PhpWord\Element\AbstractContainer) {
                $parts[] = $this->extractPhpWordSectionText($element);
            }
        }
        return implode(' ', array_filter($parts));
    }

    /**
     * Extrait le texte d'un fichier XLSX ou ODS (format ZIP+XML).
     */
    private function extractXlsxText(string $filePath, string $extension = 'xlsx'): ?string
    {
        if (!class_exists('ZipArchive')) {
            Log::warning('ZipArchive extension not available for XLSX extraction.');
            return null;
        }

        $zip = new \ZipArchive();
        if ($zip->open($filePath) !== true) {
            return null;
        }

        $parts = [];

        if ($extension === 'ods') {
            $xmlContent = $zip->getFromName('content.xml');
            if ($xmlContent !== false) {
                $xmlContent = preg_replace('/<\/?(table:table-cell|table:covered-table-cell)[^>]*>/i', ' ', $xmlContent);
                $parts[] = strip_tags($xmlContent);
            }
        } else {
            $sharedStrings = $zip->getFromName('xl/sharedStrings.xml');
            if ($sharedStrings !== false) {
                preg_match_all('/<t[^>]*>(.*?)<\/t>/s', $sharedStrings, $matches);
                if (!empty($matches[1])) {
                    $parts[] = implode(' ', array_map('html_entity_decode', $matches[1]));
                }
            }
        }

        $zip->close();

        if (empty($parts)) {
            return null;
        }

        $text = implode("\n", $parts);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/(\s*\n\s*){3,}/', "\n\n", trim($text));

        return !empty($text) ? $text : null;
    }
}
