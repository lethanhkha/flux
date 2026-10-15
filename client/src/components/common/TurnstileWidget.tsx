import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error?: any) => void;
  onExpire?: () => void;
  action?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          callback?: (token: string) => void;
          'error-callback'?: (error: any) => void;
          'expired-callback'?: () => void;
          action?: string;
          cData?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const loadTurnstileScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      if ((existingScript as any)._loaded) {
        resolve();
      } else {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (script as any)._loaded = true;
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  ({ onVerify, onError, onExpire, action, className, theme = 'auto' }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [hasError, setHasError] = useState(false);

    const siteKey =
      import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            // Safe reset fallback
          }
        }
      },
    }));

    useEffect(() => {
      let isMounted = true;

      const initWidget = async () => {
        try {
          await loadTurnstileScript();
          if (!isMounted || !containerRef.current || !window.turnstile) return;

          // Detect active theme if 'auto'
          const computedTheme =
            theme === 'auto'
              ? document.documentElement.classList.contains('dark')
                ? 'dark'
                : 'light'
              : theme;

          // Clear previous instance and clean DOM if re-rendering
          if (widgetIdRef.current) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {
              // ignore
            }
            widgetIdRef.current = null;
          }
          if (containerRef.current) {
            containerRef.current.innerHTML = '';
          }

          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: computedTheme,
            action,
            callback: (token: string) => {
              if (isMounted) {
                setHasError(false);
                onVerify(token);
              }
            },
            'error-callback': (err: any) => {
              if (isMounted) {
                setHasError(true);
                onError?.(err);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                onExpire?.();
              }
            },
          });

          widgetIdRef.current = id;
        } catch (err) {
          if (isMounted) {
            setHasError(true);
            onError?.(err);
          }
        }
      };

      initWidget();

      return () => {
        isMounted = false;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // ignore
          }
        }
      };
    }, [siteKey, theme, action]);

    return (
      <div className={`w-full flex flex-col items-center justify-center my-2 min-h-[66px] ${className || ''}`}>
        <div ref={containerRef} className="flex justify-center" />
        {hasError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-500 mt-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Không thể kết nối Cloudflare Turnstile. Vui lòng tải lại trang.</span>
          </div>
        )}
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
