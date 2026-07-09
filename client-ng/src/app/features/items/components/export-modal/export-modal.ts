import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Item } from '../../../../shared/models/item.model';
import {
  exportItemsToCSV,
  exportItemsToXLSX,
  exportItemsToPDF,
  exportItemsToJSON,
} from '../../../../shared/utils/export.utils';

@Component({
  selector: 'app-export-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './export-modal.html',
  styleUrl: './export-modal.scss',
})
export class ExportModal {
  @Input({ required: true }) items!: Item[];
  @Output() cancelled = new EventEmitter<void>();

  exportCSV() {
    exportItemsToCSV(this.items);
    this.cancelled.emit();
  }

  async exportXLSX() {
    await exportItemsToXLSX(this.items);
    this.cancelled.emit();
  }

  async exportPDF() {
    await exportItemsToPDF(this.items);
    this.cancelled.emit();
  }

  exportJSON() {
    exportItemsToJSON(this.items);
    this.cancelled.emit();
  }
}
