import { Component, EventEmitter, Output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideCalendar, LucideChevronDown } from '@lucide/angular';

export interface DateRange {
  fecha_inicio: string;
  fecha_fin: string;
}

@Component({
  selector: 'app-date-range',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideCalendar, LucideChevronDown],
  templateUrl: './date-range.component.html',
  styleUrl: './date-range.component.css',
})
export class DateRangeComponent implements OnInit {
  @Output() rangeChange = new EventEmitter<DateRange>();

  readonly fechaInicio = signal('');
  readonly fechaFin = signal('');
  readonly isOpen = signal(false);
  readonly error = signal<string | null>(null);

  readonly today = computed(() => this.formatDate(new Date()));

  readonly displayText = computed(() => {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();
    if (!inicio || !fin) return 'Seleccionar rango';
    return `${this.formatDisplayDate(inicio)} – ${this.formatDisplayDate(fin)}`;
  });

  ngOnInit(): void {
    const fin = new Date();
    const inicio = new Date();
    inicio.setFullYear(inicio.getFullYear() - 1);

    this.fechaInicio.set(this.formatDate(inicio));
    this.fechaFin.set(this.formatDate(fin));
    this.emitRange();
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  onApply(): void {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();

    if (!inicio || !fin) {
      this.error.set('Selecciona ambas fechas.');
      return;
    }

    if (inicio > fin) {
      this.error.set('La fecha de inicio no puede ser posterior a la fecha fin.');
      return;
    }

    if (fin > this.today()) {
      this.error.set('La fecha fin no puede ser futura.');
      return;
    }

    this.error.set(null);
    this.emitRange();
    this.close();
  }

  onClear(): void {
    const fin = new Date();
    const inicio = new Date();
    inicio.setFullYear(inicio.getFullYear() - 1);

    this.fechaInicio.set(this.formatDate(inicio));
    this.fechaFin.set(this.formatDate(fin));
    this.error.set(null);
  }

  private emitRange(): void {
    this.rangeChange.emit({
      fecha_inicio: this.fechaInicio(),
      fecha_fin: this.fechaFin(),
    });
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDisplayDate(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
