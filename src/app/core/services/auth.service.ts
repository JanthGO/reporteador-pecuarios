import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ResponseLogin } from '../interfaces/auth/ResponseLogin';
import { ResponseEmpresa } from '../interfaces/auth/ResponseEmpresa';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<ResponseLogin | null>(this.getStoredUser());
  public empresaNombre = signal<string | null>(null);

  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  async login(email: string, password: string): Promise<ResponseLogin> {
    const form = new FormData();
    form.append('email', email);
    form.append('password', password);
    form.append('division', environment.division.toString());

    const response = await firstValueFrom(
      this.http.post<ResponseLogin>(`${environment.api}login`, form)
    );
    this.currentUser.set(response);
    this.setStoredUser(response);
    return response;
  }

  async loadEmpresaNombre(): Promise<void> {
    const user = this.currentUser();
    console.log('[AuthService] currentUser:', user);
    const empresaId = user?.empresa;
    console.log('[AuthService] empresaId:', empresaId);
    if (!empresaId) return;

    try {
      const url = `${environment.api}name-enterprise/${empresaId}`;
      console.log('[AuthService] URL:', url);
      const response = await firstValueFrom(
        this.http.get<ResponseEmpresa>(url)
      );
      console.log('[AuthService] response:', response);
      this.empresaNombre.set(response.data.nombre.trim());
    } catch (error) {
      console.error('[AuthService] error:', error);
      this.empresaNombre.set(null);
    }
  }

  private getStoredUser(): ResponseLogin | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const stored = localStorage.getItem('currentUser');
    if (!stored) return null;

    try {
      return JSON.parse(stored) as ResponseLogin;
    } catch {
      localStorage.removeItem('currentUser');
      return null;
    }
  }

  private setStoredUser(user: ResponseLogin): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private clearStoredUser(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem('currentUser');
  }

  logout(): void {
    this.currentUser.set(null);
    this.empresaNombre.set(null);
    this.clearStoredUser();
  }
}
