import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  imports: [DecimalPipe, LucideDynamicIcon],
  selector: 'app-performance-card',
  styleUrl: './performance-card.css',
  templateUrl: './performance-card.html',
})
export class PerformanceCard {
  titulo = input<string>('');
  visitas = input<number>(0);
  iconClass = input<string>('');
  iconName = input<string>('');
  selected = input<boolean>(false);

  cardClick = output<void>();
}
