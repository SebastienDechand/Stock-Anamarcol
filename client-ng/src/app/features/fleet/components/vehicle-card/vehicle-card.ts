import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertCircle, Edit2, Trash2, FileText } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Vehicle } from '../../../../shared/models/vehicle.model';
import {
  VehicleDateStatus,
  formatVehicleDate,
  vehicleDateStatus,
  vehicleRevisionStatus,
} from '../../../../shared/utils/vehicle-status.utils';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './vehicle-card.html',
  styleUrl: './vehicle-card.scss',
})
export class VehicleCard {
  @Input({ required: true }) vehicle!: Vehicle;
  @Input() isAdmin = false;
  @Output() edit = new EventEmitter<Vehicle>();
  @Output() delete = new EventEmitter<Vehicle>();
  @Output() viewDocuments = new EventEmitter<Vehicle>();

  readonly alertCircle = AlertCircle;
  readonly edit2 = Edit2;
  readonly trash2 = Trash2;
  readonly fileText = FileText;

  formatDate = formatVehicleDate;

  get formatBadgeClass(): string {
    const map: Record<string, string> = {
      utilitaire: 'badge badge--blue',
      pickup: 'badge badge--green',
      camion: 'badge badge--orange',
    };
    return map[this.vehicle.format] ?? 'badge';
  }

  get formatLabel(): string {
    const map: Record<string, string> = {
      utilitaire: 'FLEET.FORMAT_UTILITAIRE',
      pickup: 'FLEET.FORMAT_PICKUP',
      camion: 'FLEET.FORMAT_CAMION',
    };
    return map[this.vehicle.format] ?? this.vehicle.format;
  }

  dateStatus(date: string | Date | undefined): VehicleDateStatus {
    return vehicleDateStatus(date);
  }

  revisionStatus(): VehicleDateStatus {
    return vehicleRevisionStatus(this.vehicle.dateRevision);
  }

  get hasAlert(): boolean {
    return (
      (this.dateStatus(this.vehicle.dateCtExpiration) !== 'ok' &&
        this.dateStatus(this.vehicle.dateCtExpiration) !== 'none') ||
      (this.dateStatus(this.vehicle.dateControlAntiPollutionExpiration) !== 'ok' &&
        this.dateStatus(this.vehicle.dateControlAntiPollutionExpiration) !== 'none') ||
      (this.revisionStatus() !== 'ok' && this.revisionStatus() !== 'none')
    );
  }
}
