import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function useFlashToast() {
    const { props } = usePage<{ flash?: { success?: string; error?: string; info?: string } }>();

    useEffect(() => {
        if (props.flash?.success) toast.success(props.flash.success);
        if (props.flash?.error) toast.error(props.flash.error);
        if (props.flash?.info) toast.info(props.flash.info);
    }, [props.flash]);
}
