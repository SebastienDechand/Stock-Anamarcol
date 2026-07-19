import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Shipment } from '../../../../shared/models/shipment.model';
import {
  exportShipmentsToCSV,
  exportShipmentsToXLSX,
  exportShipmentsToPDF,
} from '../../../../shared/utils/shipment-export.utils';

@Component({
  selector: 'app-shipment-export-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './shipment-export-modal.html',
  styleUrl: './shipment-export-modal.scss',
})
export class ShipmentExportModal {
  shipments = input.required<Shipment[]>();
  cancelled = output<void>();

  exportCSV() {
    exportShipmentsToCSV(this.shipments());
    this.cancelled.emit();
  }

  async exportXLSX() {
    await exportShipmentsToXLSX(this.shipments());
    this.cancelled.emit();
  }

  async exportPDF() {
    await exportShipmentsToPDF(this.shipments());
    this.cancelled.emit();
  }
}
