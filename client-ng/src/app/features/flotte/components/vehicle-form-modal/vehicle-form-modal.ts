import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
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
import { UsersFacade } from '../../../membres/store/users.facade';

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

  @Input() vehicle: Vehicle | null = null;
  @Output() save = new EventEmitter<{ id?: string; data: VehicleForm }>();
  @Output() closed = new EventEmitter<void>();

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
      if (this.vehicle) {
        this.form = {
          marque: this.vehicle.marque,
          modele: this.vehicle.modele,
          format: this.vehicle.format,
          immatriculation: this.vehicle.immatriculation,
          dateRevision: this.toDateInput(this.vehicle.dateRevision),
          dateCtInspection: this.toDateInput(this.vehicle.dateCtInspection),
          dateCtExpiration: this.toDateInput(this.vehicle.dateCtExpiration),
          dateControlAntiPollutionInspection: this.toDateInput(
            this.vehicle.dateControlAntiPollutionInspection,
          ),
          dateControlAntiPollutionExpiration: this.toDateInput(
            this.vehicle.dateControlAntiPollutionExpiration,
          ),
          assignedTo:
            (typeof this.vehicle.assignedTo === 'object'
              ? this.vehicle.assignedTo?._id
              : this.vehicle.assignedTo) ?? '',
          notes: this.vehicle.notes ?? '',
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
    this.save.emit({ id: this.vehicle?._id, data: { ...this.form } });
  }

  get isEdit(): boolean {
    return !!this.vehicle;
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
