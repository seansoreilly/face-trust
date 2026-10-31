import { useCallback } from 'react';
import { AnalyticsEvents, sendEvent, shouldLoadAnalytics } from '@/lib/analytics';

export const useAnalytics = () => {
  const trackEvent = useCallback(
    <K extends keyof AnalyticsEvents>(eventName: K, params: AnalyticsEvents[K]): void => {
      sendEvent(eventName, params);
    },
    []
  );

  const trackPageView = useCallback((pageTitle: string, pagePath: string) => {
    if (shouldLoadAnalytics() && typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath,
      });
    }
  }, []);

  return { trackEvent, trackPageView };
};
