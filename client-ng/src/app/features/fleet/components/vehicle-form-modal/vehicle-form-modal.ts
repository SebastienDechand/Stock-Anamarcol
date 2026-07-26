import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
} from '../../../../shared/models/vehicle/vehicle.model';
import { UsersFacade } from '../../../members/store/facade/users.facade';
import {
  licensePlateFormatValidator,
  requiredTrimmedValidator,
} from '../../../../shared/utils/validators/validators.utils';

function addYears(dateStr: string, years: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

const BRAND_MODEL: Record<VehicleBrand, VehicleModel[]> = {
  mercedes: ['citan', 'vito'],
  nissan: ['navara'],
};

const MODEL_FORMAT: Record<VehicleModel, VehicleFormat[]> = {
  citan: ['van'],
  vito: ['van', 'truck'],
  navara: ['pickup'],
};

@Component({
  selector: 'app-vehicle-form-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe,
    LucideAngularModule,
    DateInput,
  ],
  templateUrl: './vehicle-form-modal.html',
  styleUrl: './vehicle-form-modal.scss',
})
export class VehicleFormModal implements OnChanges {
  private readonly usersFacade = inject(UsersFacade);
  private readonly fb = inject(FormBuilder);

  vehicle = input<Vehicle | null>(null);
  save = output<{ id?: string; data: VehicleForm }>();
  closed = output<void>();

  readonly x = X;
  readonly users = toSignal(this.usersFacade.users$, { initialValue: [] });

  licensePlateControl = this.fb.nonNullable.control('', [
    requiredTrimmedValidator,
    licensePlateFormatValidator,
  ]);

  form: Omit<VehicleForm, 'licensePlate'> = {
    brand: 'mercedes',
    model: 'citan',
    format: 'van',
    serviceDate: '',
    inspectionDate: '',
    inspectionExpiryDate: '',
    antiPollutionInspectionDate: '',
    antiPollutionExpiryDate: '',
    assignedTo: '',
    notes: '',
  };

  availableModels: VehicleModel[] = BRAND_MODEL['mercedes'];
  availableFormats: VehicleFormat[] = MODEL_FORMAT['citan'];

  brandOptions: { value: VehicleBrand; label: string }[] = [
    { value: 'mercedes', label: 'Mercedes' },
    { value: 'nissan', label: 'Nissan' },
  ];

  modelLabels: Record<VehicleModel, string> = {
    citan: 'Citan',
    vito: 'Vito',
    navara: 'Navara',
  };

  formatLabels: Record<VehicleFormat, string> = {
    van: 'Utilitaire',
    pickup: 'Pickup',
    truck: 'Camion',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['vehicle']) {
      const vehicle = this.vehicle();
      if (vehicle) {
        this.licensePlateControl.setValue(vehicle.licensePlate);
        this.form = {
          brand: vehicle.brand,
          model: vehicle.model,
          format: vehicle.format,
          serviceDate: this.toDateInput(vehicle.serviceDate),
          inspectionDate: this.toDateInput(vehicle.inspectionDate),
          inspectionExpiryDate: this.toDateInput(vehicle.inspectionExpiryDate),
          antiPollutionInspectionDate: this.toDateInput(vehicle.antiPollutionInspectionDate),
          antiPollutionExpiryDate: this.toDateInput(vehicle.antiPollutionExpiryDate),
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

  onBrandChange(): void {
    this.availableModels = BRAND_MODEL[this.form.brand] ?? [];
    this.form.model = this.availableModels[0];
    this.onModelChange();
  }

  onModelChange(): void {
    this.availableFormats = MODEL_FORMAT[this.form.model] ?? [];
    this.form.format = this.availableFormats[0];
  }

  onCtInspectionChange(value?: string): void {
    if (value !== undefined) this.form.inspectionDate = value;
    if (this.form.inspectionDate) {
      this.form.inspectionExpiryDate = addYears(this.form.inspectionDate, 2);
    }
  }

  onAntiPollutionInspectionChange(value?: string): void {
    if (value !== undefined) this.form.antiPollutionInspectionDate = value;
    if (this.form.antiPollutionInspectionDate) {
      this.form.antiPollutionExpiryDate = addYears(this.form.antiPollutionInspectionDate, 2);
    }
  }

  submit(): void {
    if (this.licensePlateControl.invalid) {
      this.licensePlateControl.markAsTouched();
      return;
    }
    this.save.emit({
      id: this.vehicle()?._id,
      data: { ...this.form, licensePlate: this.licensePlateControl.value },
    });
  }

  get isEdit(): boolean {
    return !!this.vehicle();
  }

  private toDateInput(date: string | Date | undefined): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  private resetForm(): void {
    this.licensePlateControl.reset('');
    this.form = {
      brand: 'mercedes',
      model: 'citan',
      format: 'van',
      serviceDate: '',
      inspectionDate: '',
      inspectionExpiryDate: '',
      antiPollutionInspectionDate: '',
      antiPollutionExpiryDate: '',
      assignedTo: '',
      notes: '',
    };
  }

  private updateDependencies(): void {
    this.availableModels = BRAND_MODEL[this.form.brand] ?? [];
    this.availableFormats = MODEL_FORMAT[this.form.model] ?? [];
  }
}
