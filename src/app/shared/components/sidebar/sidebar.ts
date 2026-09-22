import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import {
  LucideLayoutGrid,
  LucideMail,
  LucideImage,
  LucideFileText,
  LucideGlobe,
  LucideNewspaper,
  LucideCalendar,
  LucideVideo,
  LucideUsers,
  LucideSyringe,
} from '@lucide/angular';

@Component({
  imports: [
    LucideLayoutGrid,
    LucideMail,
    LucideImage,
    LucideFileText,
    LucideGlobe,
    LucideNewspaper,
    LucideCalendar,
    LucideVideo,
    LucideUsers,
    LucideSyringe
  ],
  selector: 'app-sidebar',
  styleUrl: './sidebar.css',
  templateUrl: './sidebar.html',
})
export class Sidebar {
  protected readonly authService = inject(AuthService);
  public readonly empresaNombre = this.authService.empresaNombre;

}
