import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Item } from '../../../../shared/models/item/item.model';
import {
  exportItemsToCSV,
  exportItemsToXLSX,
  exportItemsToPDF,
  exportItemsToJSON,
} from '../../../../shared/utils/export/export.utils';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './export-modal.html',
  styleUrl: './export-modal.scss',
})
export class ExportModal {
  items = input.required<Item[]>();
  cancelled = output<void>();

  exportCSV() {
    exportItemsToCSV(this.items());
    this.cancelled.emit();
  }

  async exportXLSX() {
    await exportItemsToXLSX(this.items());
    this.cancelled.emit();
  }

  async exportPDF() {
    await exportItemsToPDF(this.items());
    this.cancelled.emit();
  }

  exportJSON() {
    exportItemsToJSON(this.items());
    this.cancelled.emit();
  }
}
