import { Component, inject, input, output } from '@angular/core';
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
import { LanguageService } from '../../../../core/services/language.service';
import { resolveLocale } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-shipment-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './shipment-card.html',
  styleUrl: './shipment-card.scss',
})
export class ShipmentCard {
  private languageService = inject(LanguageService);

  shipment = input.required<Shipment>();
  canMarkSent = input(false);
  canDelete = input(false);
  markSent = output<Shipment>();
  delete = output<Shipment>();
  viewDetail = output<Shipment>();

  readonly check = Check;
  readonly trash2 = Trash2;
  readonly mapPin = MapPin;
  readonly packageIcon = Package;
  readonly user = User;
  readonly clock = Clock;
  readonly eye = Eye;

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(resolveLocale(this.languageService.current));
  }
}
