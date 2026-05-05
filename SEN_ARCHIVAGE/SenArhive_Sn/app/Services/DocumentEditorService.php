<?php

namespace App\Services;

use App\Exceptions\PlanLimitException;
use App\Models\Document;
use App\Models\VersionDocument;
use App\Models\Utilisateur;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class DocumentEditorService
{
    /**
     * Vérifie si le document peut être édité
     */
    public function canBeEdited(Document $document): bool
    {
        $editableExtensions = ['docx', 'xlsx', 'xls', 'doc', 'txt'];
        return in_array(strtolower($document->extension), $editableExtensions);
    }

    /**
     * Récupère le contenu HTML d'un document Word ou Excel
     */
    public function getDocumentPreview(Document $document): string
    {
        $version = $document->derniereVersion;
        if (!$version) {
            return '<p>Aucune version disponible</p>';
        }

        $filePath = Storage::disk('local')->path($version->chemin_stockage);
        $extension = strtolower($document->extension);

        try {
            if ($extension === 'docx') {
                return $this->getDocxPreview($filePath);
            } elseif ($extension === 'doc') {
                return $this->getDocPreview($filePath);
            } elseif (in_array($extension, ['xlsx', 'xls'])) {
                return $this->getExcelPreview($filePath);
            } elseif ($extension === 'txt') {
                return $this->getTxtPreview($filePath);
            }
        } catch (\Exception $e) {
            return '<p>Erreur lors de la lecture du document: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }

        return '<p>Format non supporté</p>';
    }

    /**
     * Génère l'aperçu HTML pour un document DOCX
     */
    private function getDocxPreview(string $filePath): string
    {
        try {
            $zip = new \ZipArchive();
            if (!$zip->open($filePath)) {
                return '<p>Impossible d\'ouvrir le fichier DOCX</p>';
            }

            // Lire le fichier document.xml
            $xml = $zip->getFromName('word/document.xml');
            $zip->close();

            if (!$xml) {
                return '<p>Document vide</p>';
            }

            // Parser le XML et extraire le texte
            $dom = new \DOMDocument();
            $dom->loadXML($xml);
            $xpath = new \DOMXPath($dom);

            $html = '';
            $paragraphs = $xpath->query('//w:p');
            
            foreach ($paragraphs as $para) {
                $texts = $xpath->query('.//w:t', $para);
                $paraText = '';
                foreach ($texts as $text) {
                    $paraText .= $text->nodeValue;
                }
                if (!empty(trim($paraText))) {
                    $html .= '<p>' . htmlspecialchars($paraText) . '</p>';
                }
            }

            // Extraire les tables
            $tables = $xpath->query('//w:tbl');
            foreach ($tables as $table) {
                $html .= '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
                $rows = $xpath->query('.//w:tr', $table);
                foreach ($rows as $row) {
                    $html .= '<tr>';
                    $cells = $xpath->query('.//w:tc', $row);
                    foreach ($cells as $cell) {
                        $cellTexts = $xpath->query('.//w:t', $cell);
                        $cellContent = '';
                        foreach ($cellTexts as $text) {
                            $cellContent .= $text->nodeValue;
                        }
                        $html .= '<td style="border: 1px solid #999; padding: 5px;">' . htmlspecialchars($cellContent) . '</td>';
                    }
                    $html .= '</tr>';
                }
                $html .= '</table>';
            }

            return !empty($html) ? $html : '<p>Document vide</p>';
        } catch (\Exception $e) {
            return '<p>Erreur: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    }

    /**
     * Génère l'aperçu HTML pour un document DOC (via un wrapper simple)
     */
    private function getDocPreview(string $filePath): string
    {
        return '<p>Les documents .doc ne sont pas complètement supportés. Veuillez les convertir en .docx</p>';
    }

    /**
     * Génère l'aperçu HTML pour un document Excel
     */
    private function getExcelPreview(string $filePath): string
    {
        try {
            $zip = new \ZipArchive();
            if (!$zip->open($filePath)) {
                return '<p>Impossible d\'ouvrir le fichier Excel</p>';
            }

            // Pour XLSX, lire le fichier xl/workbook.xml et les fichiers de feuille
            $hasXlsx = $zip->locateName('xl/workbook.xml') !== false;
            if (!$hasXlsx) {
                $zip->close();
                return '<p>Format Excel non supporté</p>';
            }

            $html = '';

            // Charger les shared strings si présentes
            $sharedStrings = [];
            if ($zip->locateName('xl/sharedStrings.xml') !== false) {
                $ssXml = $zip->getFromName('xl/sharedStrings.xml');
                if ($ssXml) {
                    $domSs = new \DOMDocument();
                    $domSs->loadXML($ssXml);
                    $siNodes = $domSs->getElementsByTagName('si');
                    foreach ($siNodes as $si) {
                        // Concaténer tous les textes d'un shared string
                        $texts = $si->getElementsByTagName('t');
                        $s = '';
                        foreach ($texts as $t) {
                            $s .= $t->nodeValue;
                        }
                        $sharedStrings[] = $s;
                    }
                }
            }

            // Lire les feuilles de calcul
            $i = 1;
            while (($sheetXml = $zip->getFromName("xl/worksheets/sheet{$i}.xml")) !== false) {
                $sheetName = "Feuille {$i}";
                
                // Essayer de récupérer le nom depuis le workbook
                $workbookXml = $zip->getFromName('xl/workbook.xml');
                if ($workbookXml) {
                    $dom = new \DOMDocument();
                    $dom->loadXML($workbookXml);
                    $sheets = $dom->getElementsByTagName('sheet');
                    if ($sheets->length > $i - 1) {
                        $sheetName = $sheets->item($i - 1)->getAttribute('name');
                    }
                }

                $html .= '<h3>' . htmlspecialchars($sheetName) . '</h3>';
                $html .= '<table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">';

                // Parser le worksheet XML
                $dom = new \DOMDocument();
                $dom->loadXML($sheetXml);
                $rows = $dom->getElementsByTagName('row');

                foreach ($rows as $row) {
                    $html .= '<tr>';
                    $cells = $row->getElementsByTagName('c');

                    foreach ($cells as $cell) {
                        $value = '';

                        // Type de la cellule (s = shared string, b = boolean, inlineStr = texte inline)
                        $type = $cell->getAttribute('t');

                        $vNode = $cell->getElementsByTagName('v')->item(0);
                        if ($vNode) {
                            $raw = $vNode->nodeValue;
                            if ($type === 's') {
                                // shared string index
                                $idx = (int) $raw;
                                $value = $sharedStrings[$idx] ?? $raw;
                            } elseif ($type === 'b') {
                                $value = $raw === '1' ? 'TRUE' : 'FALSE';
                            } else {
                                $value = $raw;
                            }
                        } else {
                            // Possibilité de texte inline
                            $isNode = $cell->getElementsByTagName('is')->item(0);
                            if ($isNode) {
                                $tNode = $isNode->getElementsByTagName('t')->item(0);
                                if ($tNode) {
                                    $value = $tNode->nodeValue;
                                }
                            }
                        }

                        $html .= '<td style="border: 1px solid #ddd; padding: 8px;">' . htmlspecialchars($value) . '</td>';
                    }
                    $html .= '</tr>';
                }

                $html .= '</table>';
                $i++;
            }

            $zip->close();
            return !empty($html) ? $html : '<p>Fichier vide</p>';
        } catch (\Exception $e) {
            return '<p>Erreur: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    }

    /**
     * Génère l'aperçu HTML pour un fichier TXT
     */
    private function getTxtPreview(string $filePath): string
    {
        try {
            $content = file_get_contents($filePath);
            return '<pre style="white-space: pre-wrap; word-wrap: break-word;">' . htmlspecialchars($content) . '</pre>';
        } catch (\Exception $e) {
            return '<p>Erreur: ' . htmlspecialchars($e->getMessage()) . '</p>';
        }
    }

    /**
     * Sauvegarde le contenu édité et crée une nouvelle version
     */
    public function saveEditedDocument(Document $document, string $htmlContent, Utilisateur $user, ?string $commentaire = null): VersionDocument
    {
        $version = $document->derniereVersion;
        if (!$version) {
            throw new \Exception('Aucune version disponible');
        }

        $extension = strtolower($document->extension);
        $tempPath = tempnam(sys_get_temp_dir(), 'doc_edit_');

        try {
            // Pour l'instant, nous allons stocker simplement le contenu HTML en tant que fichier texte
            // Dans une implémentation plus avancée, vous pouvez utiliser PhpOffice
            
            if ($extension === 'txt') {
                // Pour les fichiers TXT, simplement sauvegarder le contenu
                $plainText = strip_tags($htmlContent);
                file_put_contents($tempPath, $plainText);
            } else {
                // Pour les autres formats, sauvegarder une version HTML
                file_put_contents($tempPath, $htmlContent);
            }

            // Créer la nouvelle version
            $newVersionNumber = $document->version_courante + 1;
            $cheminStockage = dirname($version->chemin_stockage) . "/{$newVersionNumber}.{$extension}";

            // Vérifier la limite de stockage avant d'écrire
            $content = file_get_contents($tempPath);
            $organisation = $document->organisation;
            if (!$organisation->hasStorageCapacity(strlen($content))) {
                $limiteGo = round($organisation->getStorageLimitMo() / 1024, 1);
                throw new PlanLimitException(
                    "Limite de stockage atteinte ({$limiteGo} Go). Impossible de sauvegarder ce document."
                );
            }

            Storage::disk('local')->put($cheminStockage, $content);

            // Créer le record de version
            $newVersion = VersionDocument::create([
                'document_id' => $document->id,
                'numero_version' => $newVersionNumber,
                'nom_fichier' => $document->nom_fichier_original,
                'taille_octets' => strlen($content),
                'hash_sha256' => hash('sha256', $content),
                'chemin_stockage' => $cheminStockage,
                'commentaire' => $commentaire ?? 'Édité et enregistré',
                'created_by' => $user->id,
            ]);

            // Mettre à jour le document
            $document->update([
                'version_courante' => $newVersionNumber,
                'taille_octets' => strlen($content),
                'updated_by' => $user->id,
            ]);

            // Mettre à jour le stockage utilisé
            $organisation = $document->organisation;
            $sizeInMb = (int) ceil(strlen($content) / 1048576);
            $organisation->increment('stockage_utilise_mo', $sizeInMb);

            return $newVersion;

        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }
}
