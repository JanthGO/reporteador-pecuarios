import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideHighcharts } from 'highcharts-angular';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import {
  provideLucideIcons,
  LucideMail,
  LucideLock,
  LucideEyeOff,
  LucideEye,
  LucideLayoutGrid,
  LucideImage,
  LucideCalendarDays,
  LucideCalendarRange,
  LucideFileText,
  LucideGlobe,
  LucideNewspaper,
  LucideCalendar,
  LucideVideo,
  LucideUsers,
  LucideDownload,
  LucideShoppingBag,
  LucideUser,
  LucideClock,
  LucideArrowRight,
  LucideSmartphone,
  LucideSyringe,
  LucideMonitor,
  LucideChevronDown,
  LucideMenu,
  LucideActivity,
} from '@lucide/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideHighcharts(),
    provideLucideIcons(
      LucideMail,
      LucideLock,
      LucideEyeOff,
      LucideEye,
      LucideLayoutGrid,
      LucideImage,
      LucideCalendarDays,
      LucideCalendarRange,
      LucideFileText,
      LucideGlobe,
      LucideNewspaper,
      LucideCalendar,
      LucideVideo,
      LucideUsers,
      LucideDownload,
      LucideShoppingBag,
      LucideUser,
      LucideClock,
      LucideArrowRight,
      LucideSmartphone,
      LucideSyringe,
      LucideMonitor,
      LucideChevronDown,
      LucideMenu,
      LucideActivity,
    ),
  ]
};
