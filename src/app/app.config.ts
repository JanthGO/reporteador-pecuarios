import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptorsFromDi, HttpInterceptorFn } from '@angular/common/http';
import { provideHighcharts } from 'highcharts-angular';
import {
  provideLucideIcons,
  LucideMail,
  LucideLock,
  LucideEyeOff,
  LucideEye,
  LucideLayoutGrid,
  LucideImage,
  LucideCalendarDays,
  LucideFileText,
  LucideGlobe,
  LucideNewspaper,
  LucideCalendar,
  LucideVideo,
  LucideUsers,
  LucideDownload,
  LucideActivity,
  LucideShoppingBag,
  LucideUser,
  LucideClock,
  LucideArrowRight,
  LucideSmartphone,
  LucideMonitor,
  LucideChevronDown,
  LucideTrendingUp,
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideHighcharts(),
    provideLucideIcons(
      LucideMail,
      LucideLock,
      LucideEyeOff,
      LucideEye,
      LucideLayoutGrid,
      LucideImage,
      LucideCalendarDays,
      LucideFileText,
      LucideGlobe,
      LucideNewspaper,
      LucideCalendar,
      LucideVideo,
      LucideUsers,
      LucideDownload,
      LucideActivity,
      LucideShoppingBag,
      LucideUser,
      LucideClock,
      LucideArrowRight,
      LucideSmartphone,
      LucideMonitor,
      LucideChevronDown,
      LucideTrendingUp,
    ),
  ]
};
