import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ResponseLogin } from '../interfaces/auth/ResponseLogin';
import { ResponseEmpresa } from '../interfaces/auth/ResponseEmpresa';
import { firstValueFrom } from 'rxjs';
import { User } from '../interfaces/auth/User';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private readonly _currentUser = signal<User | null>(
    this.getStorage<User>('currentUser')
  );

  private readonly _empresaNombre = signal<string | null>(
    this.getStorage<string>('empresaNombre')
  );

  public readonly currentUser = this._currentUser.asReadonly();
  public readonly empresaNombre = this._empresaNombre.asReadonly();

  async login(email: string, password: string): Promise<ResponseLogin> {
    const form = new FormData();
    form.append('email', email);
    form.append('password', password);
    form.append('division', environment.division.toString());

    const response = await firstValueFrom(
      this.http.post<ResponseLogin>(`${environment.api}login`, form)
    );
    this._currentUser.set(response.data);
    this.setStorage('currentUser', response.data);
    await this.loadEmpresaNombre();
    return response;
  }

  async loadEmpresaNombre(): Promise<void> {
    const empresaId = this._currentUser()?.empresa;
    if (!empresaId) return;
    try {
      const response = await firstValueFrom(
        this.http.get<ResponseEmpresa>(`${environment.api}name-enterprise/${empresaId}`)
      );
      const nombre = response.data.nombre.trim();
      this._empresaNombre.set(nombre);
      this.setStorage('empresaNombre', nombre);
    } catch {
      this._empresaNombre.set(null);
      this.removeStorage('empresaNombre');
    }
  }

  logout(): void {
    this._currentUser.set(null);
    this._empresaNombre.set(null);
    this.removeStorage('currentUser');
    this.removeStorage('empresaNombre');
  }

  public getStorage<T>(key: string): T | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as T;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  }

  public setStorage<T>(key: string, value: T): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  private removeStorage(key: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(key);
  }
}
