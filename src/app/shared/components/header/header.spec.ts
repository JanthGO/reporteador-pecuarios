import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Header } from './header';
import { AuthService } from '../../../core/services/auth.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  const authServiceMock = { logout: vi.fn() };
  const routerMock = { navigate: vi.fn() };

  function helper(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function trigger(): HTMLButtonElement {
    const el = helper().querySelector<HTMLButtonElement>('.user-menu__trigger');
    if (!el) throw new Error('Trigger del menú no encontrado');
    return el;
  }

  async function openMenu(): Promise<void> {
    trigger().click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    authServiceMock.logout.mockReset();
    routerMock.navigate.mockReset();
    routerMock.navigate.mockResolvedValue(true);

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the breadcrumb with the last segment marked as current', () => {
    fixture.componentRef.setInput('breadcrumb', ['Marca', 'Test Empresa', 'Resumen']);
    fixture.detectChanges();
    const items = Array.from(helper().querySelectorAll('.breadcrumb__item'));
    expect(items.length).toBe(3);
    expect(items[0].textContent).toContain('Marca');
    expect(items[1].textContent).toContain('Test Empresa');
    expect(items[2].textContent).toContain('Resumen');
    expect(items[2].classList).toContain('breadcrumb__item--current');
    expect(items[0].classList).not.toContain('breadcrumb__item--current');
  });

  it('should render the avatar initials for a full name', () => {
    fixture.componentRef.setInput('userName', 'Juan Pérez');
    fixture.detectChanges();
    expect(helper().querySelector('.topbar__avatar')?.textContent).toBe('JP');
  });

  it('should fall back the avatar to a placeholder without a user name', () => {
    fixture.detectChanges();
    expect(helper().querySelector('.topbar__avatar')?.textContent).toBe('?');
  });

  it('should show the user name and subtitle', () => {
    fixture.componentRef.setInput('userName', 'Juan Pérez');
    fixture.componentRef.setInput('subtitle', 'Ganadería MX');
    fixture.detectChanges();
    expect(helper().textContent).toContain('Juan Pérez');
    expect(helper().textContent).toContain('Ganadería MX');
  });

  it('should emit menuClick when the menu button is pressed', () => {
    fixture.detectChanges();
    const emitSpy = vi.spyOn(fixture.componentInstance.menuClick, 'emit');
    const button = helper().querySelector<HTMLButtonElement>('.topbar__menu');
    expect(button).toBeTruthy();
    button!.click();
    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('should open and close the user dropdown from the trigger', async () => {
    await openMenu();
    expect(helper().querySelector('.user-menu')?.classList).toContain('user-menu--open');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');

    trigger().click();
    fixture.detectChanges();
    expect(helper().querySelector('.user-menu')?.classList).not.toContain('user-menu--open');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('should close the dropdown when clicking outside the header', async () => {
    await openMenu();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('should keep the dropdown open when clicking inside it', async () => {
    await openMenu();
    const logoutButton = helper().querySelector<HTMLButtonElement>('.user-menu__logout');
    logoutButton!.click();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('should close the dropdown on Escape', async () => {
    await openMenu();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('should clear auth state and navigate to /login on logout', async () => {
    await openMenu();
    const logoutButton = helper().querySelector<HTMLButtonElement>('.user-menu__logout');
    logoutButton!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authServiceMock.logout).toHaveBeenCalledOnce();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('should show an error and keep the menu open when logout fails', async () => {
    authServiceMock.logout.mockImplementation(() => {
      throw new Error('boom');
    });

    await openMenu();
    const logoutButton = helper().querySelector<HTMLButtonElement>('.user-menu__logout');
    logoutButton!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(helper().querySelector('.user-menu__error')).toBeTruthy();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });
});