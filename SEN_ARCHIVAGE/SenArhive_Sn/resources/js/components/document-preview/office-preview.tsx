import { useEffect, useState } from 'react';

interface OfficePreviewProps {
    url: string;
}

export default function OfficePreview({ url }: OfficePreviewProps) {
    const [preview, setPreview] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Erreur lors du chargement');
                const data = await response.json();
                setPreview(data.preview || '');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [url]);

    if (loading) {
        return <div className="text-center py-12"><p>Chargement du document...</p></div>;
    }

    if (error) {
        return <div className="text-center py-12 text-red-600"><p>Erreur: {error}</p></div>;
    }

    return (
        <div
            className="prose prose-sm max-w-none p-4 bg-white rounded-lg border"
            dangerouslySetInnerHTML={{ __html: preview }}
            style={{
                maxHeight: '70vh',
                overflowY: 'auto',
            }}
        />
    );
}
