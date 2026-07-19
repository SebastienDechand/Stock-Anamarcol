import { Component, OnChanges, SimpleChanges, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, X } from 'lucide-angular';
import { DateInput } from '../../../../shared/components/date-input/date-input';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Vehicle,
  VehicleForm,
  VehicleBrand,
  VehicleModel,
  VehicleFormat,
} from '../../../../shared/models/vehicle.model';
import { UsersFacade } from '../../../members/store/users.facade';

function addYears(dateStr: string, years: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

const MARQUE_MODELE: Record<VehicleBrand, VehicleModel[]> = {
  mercedes: ['citan', 'vito'],
  nissan: ['navara'],
};

const MODELE_FORMAT: Record<VehicleModel, VehicleFormat[]> = {
  citan: ['utilitaire'],
  vito: ['utilitaire', 'camion'],
  navara: ['pickup'],
};

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LucideAngularModule, DateInput],
  templateUrl: './vehicle-form-modal.html',
  styleUrl: './vehicle-form-modal.scss',
})
export class VehicleFormModal implements OnChanges {
  private readonly usersFacade = inject(UsersFacade);

  vehicle = input<Vehicle | null>(null);
  save = output<{ id?: string; data: VehicleForm }>();
  closed = output<void>();

  readonly x = X;
  readonly users = toSignal(this.usersFacade.users$, { initialValue: [] });

  form: VehicleForm = {
    marque: 'mercedes',
    modele: 'citan',
    format: 'utilitaire',
    immatriculation: '',
    dateRevision: '',
    dateCtInspection: '',
    dateCtExpiration: '',
    dateControlAntiPollutionInspection: '',
    dateControlAntiPollutionExpiration: '',
    assignedTo: '',
    notes: '',
  };

  availableModeles: VehicleModel[] = MARQUE_MODELE['mercedes'];
  availableFormats: VehicleFormat[] = MODELE_FORMAT['citan'];

  marqueOptions: { value: VehicleBrand; label: string }[] = [
    { value: 'mercedes', label: 'Mercedes' },
    { value: 'nissan', label: 'Nissan' },
  ];

  modeleLabels: Record<VehicleModel, string> = {
    citan: 'Citan',
    vito: 'Vito',
    navara: 'Navara',
  };

  formatLabels: Record<VehicleFormat, string> = {
    utilitaire: 'Utilitaire',
    pickup: 'Pickup',
    camion: 'Camion',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicle']) {
      const vehicle = this.vehicle();
      if (vehicle) {
        this.form = {
          marque: vehicle.marque,
          modele: vehicle.modele,
          format: vehicle.format,
          immatriculation: vehicle.immatriculation,
          dateRevision: this.toDateInput(vehicle.dateRevision),
          dateCtInspection: this.toDateInput(vehicle.dateCtInspection),
          dateCtExpiration: this.toDateInput(vehicle.dateCtExpiration),
          dateControlAntiPollutionInspection: this.toDateInput(
            vehicle.dateControlAntiPollutionInspection,
          ),
          dateControlAntiPollutionExpiration: this.toDateInput(
            vehicle.dateControlAntiPollutionExpiration,
          ),
          assignedTo:
            (typeof vehicle.assignedTo === 'object'
              ? vehicle.assignedTo?._id
              : vehicle.assignedTo) ?? '',
          notes: vehicle.notes ?? '',
        };
      } else {
        this.resetForm();
      }
      this.updateDependencies();
    }
  }

  onMarqueChange(): void {
    this.availableModeles = MARQUE_MODELE[this.form.marque] ?? [];
    this.form.modele = this.availableModeles[0];
    this.onModeleChange();
  }

  onModeleChange(): void {
    this.availableFormats = MODELE_FORMAT[this.form.modele] ?? [];
    this.form.format = this.availableFormats[0];
  }

  onCtInspectionChange(value?: string): void {
    if (value !== undefined) this.form.dateCtInspection = value;
    if (this.form.dateCtInspection) {
      this.form.dateCtExpiration = addYears(this.form.dateCtInspection, 2);
    }
  }

  onAntiPollutionInspectionChange(value?: string): void {
    if (value !== undefined) this.form.dateControlAntiPollutionInspection = value;
    if (this.form.dateControlAntiPollutionInspection) {
      this.form.dateControlAntiPollutionExpiration = addYears(
        this.form.dateControlAntiPollutionInspection,
        2,
      );
    }
  }

  submit(): void {
    if (!this.form.immatriculation.trim()) return;
    this.save.emit({ id: this.vehicle()?._id, data: { ...this.form } });
  }

  get isEdit(): boolean {
    return !!this.vehicle();
  }

  private toDateInput(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  private resetForm(): void {
    this.form = {
      marque: 'mercedes',
      modele: 'citan',
      format: 'utilitaire',
      immatriculation: '',
      dateRevision: '',
      dateCtInspection: '',
      dateCtExpiration: '',
      dateControlAntiPollutionInspection: '',
      dateControlAntiPollutionExpiration: '',
      assignedTo: '',
      notes: '',
    };
  }

  private updateDependencies(): void {
    this.availableModeles = MARQUE_MODELE[this.form.marque] ?? [];
    this.availableFormats = MODELE_FORMAT[this.form.modele] ?? [];
  }
}
