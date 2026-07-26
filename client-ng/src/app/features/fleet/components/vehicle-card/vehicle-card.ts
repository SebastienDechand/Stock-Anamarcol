import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertCircle, Edit2, Trash2, FileText } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Vehicle } from '../../../../shared/models/vehicle/vehicle.model';
import { LanguageService } from '../../../../core/services/language/language.service';
import { Badge, BadgeVariant } from '../../../../shared/components/badge/badge';
import {
  VEHICLE_FORMAT_LABEL_KEYS,
  VehicleDateStatus,
  formatVehicleDate,
  vehicleDateStatus,
  vehicleRevisionStatus,
} from '../../../../shared/utils/vehicle-status/vehicle-status.utils';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe, Badge],
  templateUrl: './vehicle-card.html',
  styleUrl: './vehicle-card.scss',
})
export class VehicleCard {
  private languageService = inject(LanguageService);

  vehicle = input.required<Vehicle>();
  isAdmin = input(false);
  edit = output<Vehicle>();
  delete = output<Vehicle>();
  viewDocuments = output<Vehicle>();

  readonly alertCircle = AlertCircle;
  readonly edit2 = Edit2;
  readonly trash2 = Trash2;
  readonly fileText = FileText;

  formatDate = (date: string | Date | undefined): string =>
    formatVehicleDate(date, this.languageService.current);

  get formatBadgeVariant(): BadgeVariant {
    const map: Record<string, BadgeVariant> = {
      van: 'blue',
      pickup: 'green',
      truck: 'orange',
    };
    return map[this.vehicle().format] ?? 'gray';
  }

  get formatLabel(): string {
    return VEHICLE_FORMAT_LABEL_KEYS[this.vehicle().format] ?? this.vehicle().format;
  }

  dateStatus(date: string | Date | undefined): VehicleDateStatus {
    return vehicleDateStatus(date);
  }

  revisionStatus(): VehicleDateStatus {
    return vehicleRevisionStatus(this.vehicle().serviceDate);
  }

  get hasAlert(): boolean {
    return (
      (this.dateStatus(this.vehicle().inspectionExpiryDate) !== 'ok' &&
        this.dateStatus(this.vehicle().inspectionExpiryDate) !== 'none') ||
      (this.dateStatus(this.vehicle().antiPollutionExpiryDate) !== 'ok' &&
        this.dateStatus(this.vehicle().antiPollutionExpiryDate) !== 'none') ||
      (this.revisionStatus() !== 'ok' && this.revisionStatus() !== 'none')
    );
  }
}
