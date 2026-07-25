import { Component, computed, input, output } from '@angular/core';
import { LucideAngularModule, ChevronLeft, ChevronRight } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [LucideAngularModule, TranslatePipe],
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  countLabel = input<string | null>(null);

  pageChange = output<number>();

  readonly chevronLeft = ChevronLeft;
  readonly chevronRight = ChevronRight;

  readonly pages = computed<(number | '...')[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const kept = Array.from({ length: total }, (_, i) => i + 1).filter(
      (page) => page === 1 || page === total || Math.abs(page - current) <= 1,
    );
    return kept.reduce<(number | '...')[]>((result, page, index) => {
      const previous = kept[index - 1];
      if (index > 0 && previous !== undefined && page - previous > 1) result.push('...');
      result.push(page);
      return result;
    }, []);
  });

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.pageChange.emit(page);
  }
}
