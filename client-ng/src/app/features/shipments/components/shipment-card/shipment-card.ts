import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Check,
  Trash2,
  MapPin,
  Package,
  User,
  Clock,
  Eye,
} from 'lucide-angular';
import { Shipment } from '../../../../shared/models/shipment.model';

@Component({
  selector: 'app-shipment-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './shipment-card.html',
  styleUrl: './shipment-card.scss',
})
export class ShipmentCard {
  @Input({ required: true }) shipment!: Shipment;
  @Input() canMarkSent = false;
  @Input() canDelete = false;
  @Output() markSent = new EventEmitter<Shipment>();
  @Output() delete = new EventEmitter<Shipment>();
  @Output() viewDetail = new EventEmitter<Shipment>();

  readonly check = Check;
  readonly trash2 = Trash2;
  readonly mapPin = MapPin;
  readonly packageIcon = Package;
  readonly user = User;
  readonly clock = Clock;
  readonly eye = Eye;

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
