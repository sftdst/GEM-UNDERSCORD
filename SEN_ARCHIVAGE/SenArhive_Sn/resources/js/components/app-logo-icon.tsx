import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="26" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="6" y="8" width="12" height="2" rx="1" fill="white" opacity="0.8" />
            <rect x="6" y="12" width="10" height="2" rx="1" fill="white" opacity="0.6" />
            <rect x="6" y="16" width="12" height="2" rx="1" fill="white" opacity="0.8" />
            <rect x="6" y="20" width="8" height="2" rx="1" fill="white" opacity="0.6" />
            <path d="M18 14 L30 6 L30 24 L18 28Z" fill="currentColor" opacity="0.6" />
        </svg>
    );
}
