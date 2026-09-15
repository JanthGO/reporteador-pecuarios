import { Injectable, signal, computed, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ResponseLogin } from '../interfaces/auth/ResponseLogin';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<ResponseLogin | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  #http = inject(HttpClient);

  async login(email: string, password: string): Promise<ResponseLogin> {
    const form = new FormData();
    form.append('email', email);
    form.append('password', password);
    form.append('division', environment.division.toString());

    const response = await firstValueFrom(
      this.#http.post<ResponseLogin>(`${environment.api}login`, form)
    );

    this.currentUser.set(response);
    return response;
  }

  logout(): void {
    this.currentUser.set(null);
  }
}
