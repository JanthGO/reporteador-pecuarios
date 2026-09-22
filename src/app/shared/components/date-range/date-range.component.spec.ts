import { TestBed } from '@angular/core/testing';
import { DateRangeComponent } from './date-range.component';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('DateRangeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateRangeComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize with default range: one month ago to today', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const today = new Date();
    const expectedFin = formatDate(today);
    const expectedInicio = new Date();
    expectedInicio.setMonth(expectedInicio.getMonth() - 1);

    expect(component.fechaInicio()).toBe(formatDate(expectedInicio));
    expect(component.fechaFin()).toBe(expectedFin);
  });

  it('should emit rangeChange on init', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    const spy = vi.spyOn(component.rangeChange, 'emit');
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should display formatted date range text', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.displayText()).toMatch(/\d{2}\/\d{2}\/\d{4} – \d{2}\/\d{2}\/\d{4}/);
  });

  it('should toggle dropdown open/close', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.isOpen()).toBeFalsy();
    component.toggleOpen();
    expect(component.isOpen()).toBeTruthy();
    component.toggleOpen();
    expect(component.isOpen()).toBeFalsy();
  });

  it('should show error when start date is after end date', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.fechaInicio.set('2026-09-30');
    component.fechaFin.set('2026-09-01');
    component.onApply();
    expect(component.error()).toBe('La fecha de inicio no puede ser posterior a la fecha fin.');
  });

  it('should show error when end date is in the future', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.fechaInicio.set('2026-01-01');
    component.fechaFin.set('2099-12-31');
    component.onApply();
    expect(component.error()).toBe('La fecha fin no puede ser futura.');
  });

  it('should clear error and emit range on valid apply', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    const spy = vi.spyOn(component.rangeChange, 'emit');
    fixture.detectChanges();
    component.fechaInicio.set('2026-08-01');
    component.fechaFin.set('2026-09-21');
    component.onApply();
    expect(component.error()).toBeNull();
    expect(component.isOpen()).toBeFalsy();
    expect(spy).toHaveBeenCalledWith({ fecha_inicio: '2026-08-01', fecha_fin: '2026-09-21' });
  });

  it('should reset to default range on clear', () => {
    const fixture = TestBed.createComponent(DateRangeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.fechaInicio.set('2020-01-01');
    component.fechaFin.set('2020-12-31');
    component.onClear();
    const today = new Date();
    const expectedInicio = new Date();
    expectedInicio.setMonth(expectedInicio.getMonth() - 1);
    expect(component.fechaInicio()).toBe(formatDate(expectedInicio));
    expect(component.fechaFin()).toBe(formatDate(today));
  });
});

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
