import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { Footer } from '../../shared/components/footer/footer';
import { Router } from '@angular/router';
import { LucideMail, LucideLock, LucideEyeOff, LucideEye } from '@lucide/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, Footer, LucideMail, LucideLock, LucideEyeOff, LucideEye],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  protected readonly division = environment.division;
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly emailTouched = signal(false);
  protected readonly passwordTouched = signal(false);
  protected readonly showPassword = signal(false);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  public logo_sitio: string = '';

  protected readonly emailError = computed(() => {
    const textEmail = this.email();
    if (!textEmail) return this.emailTouched() ? 'El correo es obligatorio.' : null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.emailTouched() && !emailRegex.test(textEmail) ? 'Ingresa un correo válido' : null;
  });

  protected readonly passwordError = computed(() => {
    const textPass = this.password();
    return this.passwordTouched() && !textPass ? 'La contraseña es obligatoria.' : null;
  });

  protected readonly formValid = computed(
    () => this.emailError() === null && this.passwordError() === null && this.email() !== '' && this.password() !== '',
  );

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    switch (this.division) {
      case 1:
        this.logo_sitio = 'porcicultura.png';
        break;
      case 2:
        this.logo_sitio = 'ganaderia.png';
        break;
      case 3:
        this.logo_sitio = 'avicultura.png';
        break;
      default:
        this.logo_sitio = 'porcicultura.png';
        break;
    }
  }

  async onSubmit(): Promise<void> {
    this.emailTouched.set(true);
    this.passwordTouched.set(true);

    if (!this.formValid()) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      await this.authService.login(this.email(), this.password());
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.error.set(
        error.error?.message ?? 'No fue posible iniciar sesión.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  onEmailBlur(): void {
    this.emailTouched.set(true);
  }

  onPasswordBlur(): void {
    this.passwordTouched.set(true);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}
