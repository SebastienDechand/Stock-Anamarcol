import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import type { LucideIconData } from 'lucide-angular';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './page-hero.html',
  styleUrl: './page-hero.scss',
})
export class PageHero {
  title = input('');
  subtitle = input('');
  icon = input<LucideIconData>();
  iconName = input<string>();
  iconSize = input(22);
}
