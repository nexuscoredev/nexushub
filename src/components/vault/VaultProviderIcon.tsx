import type { VaultProvedorId } from '../../lib/vaultProviders';
import styles from './VaultProviderIcon.module.css';

interface VaultProviderIconProps {
  provider: VaultProvedorId;
  size?: number;
  className?: string;
}

export function VaultProviderIcon({ provider, size = 24, className }: VaultProviderIconProps) {
  const cn = [styles.icon, className].filter(Boolean).join(' ');

  switch (provider) {
    case 'vercel':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M12 2 2 19.5h20L12 2z" />
        </svg>
      );
    case 'supabase':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#3ECF8E"
            d="M15.34 21.5c-.38 0-.72-.24-.85-.6L9.2 4.67a.95.95 0 0 1 .87-1.28h3.02c.38 0 .72.24.85.6l5.3 16.23a.95.95 0 0 1-.87 1.28h-3.03z"
          />
          <path
            fill="#3ECF8E"
            d="M8.66 2.5c.38 0 .72.24.85.6l5.29 16.23a.95.95 0 0 1-.87 1.28H11.9a.95.95 0 0 1-.85-.6L5.75 3.78a.95.95 0 0 1 .87-1.28h2.04z"
          />
        </svg>
      );
    case 'github':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="currentColor"
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.73.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.41-5.28 5.69.42.36.8 1.08.8 2.18 0 1.57-.01 2.84-.01 3.22 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
      );
    case 'gmail':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="#EA4335" d="M5 5h14v14H5z" />
          <path fill="#FBBC05" d="M5 5l7 6 7-6v3.5L12 14.5 5 8.5V5z" />
          <path fill="#34A853" d="M5 19V8.5l7 6 7-6V19H5z" />
          <path fill="#C5221F" d="M5 5h7l7 6.5V5H5z" opacity="0.9" />
          <path fill="#fff" d="M5 6.5 12 12l7-5.5v11H5V6.5z" opacity="0.15" />
        </svg>
      );
    case 'google':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case 'aws':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#FF9900"
            d="M6.5 17.2c4.8 2.2 9.9 2.2 14.6 0 .3-.1.3-.6 0-.7-1.3-.5-2.7-.9-4.1-1.1-.1 0-.2.1-.1.2.4.7.7 1.5.9 2.3 0 .1-.1.2-.2.2-3.4.6-7 .6-10.4 0-.1 0-.2-.1-.2.2-.8.5-1.6.9-2.3.1-.1 0-.2-.1-.2-1.4.2-2.8.6-4.1 1.1-.3.1-.3.6 0 .7z"
          />
          <path
            fill="#252F3E"
            d="M12 3.5 4.2 6.8v5.2c0 4.2 3.3 8.1 7.8 9.5 4.5-1.4 7.8-5.3 7.8-9.5V6.8L12 3.5z"
          />
        </svg>
      );
    case 'cloudflare':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="#F38020" d="M14.2 8.5h3.1c.4 0 .7-.3.8-.7l.4-1.5c0-.2 0-.4-.2-.5-.2-.1-.4-.1-.6 0l-1.6.7h-4.5c-.3 0-.6.2-.7.5L9.8 9.8c0 .2 0 .4.2.5h4.2z" />
          <path fill="#FAAD3F" d="M11.2 11.8h6.8c.4 0 .7-.3.8-.7l.8-2.8c.1-.3-.1-.6-.4-.7-.1 0-.3 0-.4.1l-1.3.6H10.4c-.4 0-.7.3-.8.7l-.5 1.8c0 .2.2.4.4.4h1.7z" />
          <path fill="#404041" d="M8.5 14.8h8.9c.5 0 .9-.4 1-.9l.5-1.8H7.9l.6 2.7z" />
        </svg>
      );
    case 'stripe':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="5" fill="#635BFF" />
          <path
            fill="#fff"
            d="M13.05 8.9c0-.9-.7-1.2-1.9-1.2-1.1 0-2.2.3-3 .7V6.2c1-.4 2.1-.6 3.2-.6 2.5 0 4 1.2 4 3.3v6.6h-2.7v-.7c-.7.5-1.7.9-2.8.9-1.6 0-2.8-.9-2.8-2.5 0-1.7 1.4-2.5 3.7-2.5.6 0 1.2.1 1.7.2v-.9zm-.4 2.1c-.5-.1-1-.2-1.5-.2-1 0-1.6.3-1.6 1 0 .6.5.9 1.3.9.9 0 1.6-.4 1.8-.9v-1.8z"
          />
        </svg>
      );
    case 'notion':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M4 3.5h16a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" />
          <path fill="#fff" d="M7 7h3.5l.5 4.5L12 7h3.5l-1 10H11l.5-4.5L9 17H7l1-10z" />
        </svg>
      );
    case 'slack':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="#E01E5A" d="M5.7 14.1a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0zm2.1-2.1a2.1 2.1 0 0 1 0-4.2H9.9V12z" />
          <path fill="#36C5F0" d="M9.9 5.7a2.1 2.1 0 1 1 4.2 0v2.1H9.9V5.7z" />
          <path fill="#2EB67D" d="M14.1 9.9a2.1 2.1 0 1 1 0 4.2v-2.1h-2.1z" />
          <path fill="#ECB22E" d="M18.3 14.1a2.1 2.1 0 0 1-4.2 0v-2.1h2.1v2.1z" />
          <path fill="#E01E5A" d="M14.1 18.3a2.1 2.1 0 1 1-4.2 0v-2.1h2.1v2.1z" />
          <path fill="#36C5F0" d="M9.9 18.3v2.1a2.1 2.1 0 1 1-4.2 0v-2.1h2.1z" />
        </svg>
      );
    case 'microsoft':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
          <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
          <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
          <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
        </svg>
      );
    case 'todoist':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="5" fill="#E44332" />
          <path d="M7 12.5 10 15.5 17 8.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'docker':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <path fill="#2496ED" d="M4 10h2v2H4v-2zm3 0h2v2H7v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm-9 3h2v2H4v-2zm3 0h2v2H7v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zM3 14h14c0 3-2 5-6 5s-6-2-6-5z" />
        </svg>
      );
    case 'npm':
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <rect width="24" height="24" rx="2" fill="#CB3837" />
          <path fill="#fff" d="M6 6h12v12H6V6zm2 2v8h8v-8H8zm1 1h6v6H9V9z" />
        </svg>
      );
    default:
      return (
        <svg className={cn} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path fill="currentColor" d="M12 8v5l3 2" />
        </svg>
      );
  }
}
