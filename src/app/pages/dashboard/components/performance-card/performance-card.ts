import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  imports: [DecimalPipe],
  selector: 'app-performance-card',
  styleUrl: './performance-card.css',
  templateUrl: './performance-card.html',
})
export class PerformanceCard {
  titulo = input<string>('');
  visitas = input<number>(0);
  iconClass = input<string>('');
  svgIcon = input<string>('');
  selected = input<boolean>(false);

  cardClick = output<void>();
}
