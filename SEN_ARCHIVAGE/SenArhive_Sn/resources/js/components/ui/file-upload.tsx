import { Upload, X, FileText } from 'lucide-react';
import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    selectedFile?: File | null;
    onClear?: () => void;
}

export function FileUpload({ onFileSelect, accept, maxSizeMB = 50, selectedFile, onClear }: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateAndSelect = useCallback((file: File) => {
        setError(null);
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
            setError(`Le fichier ne doit pas dépasser ${maxSizeMB} Mo.`);
            return;
        }
        onFileSelect(file);
    }, [maxSizeMB, onFileSelect]);

    const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) validateAndSelect(file);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndSelect(file);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} o`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
        return `${(bytes / 1048576).toFixed(1)} Mo`;
    };

    if (selectedFile) {
        return (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                <FileText className="h-8 w-8 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
                </div>
                {onClear && (
                    <Button type="button" variant="ghost" size="icon" onClick={onClear}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div>
            <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
            >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Glissez-déposez un fichier ici</p>
                <p className="mt-1 text-xs text-muted-foreground">ou cliquez pour sélectionner (max {maxSizeMB} Mo)</p>
                <input type="file" className="hidden" accept={accept} onChange={handleChange} />
            </label>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
    );
}
