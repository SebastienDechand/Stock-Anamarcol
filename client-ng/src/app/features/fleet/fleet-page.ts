import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  LucideAngularModule,
  LucideIconData,
  AlertCircle,
  Bus,
  Car,
  ChevronDown,
  Edit2,
  FileText,
  Plus,
  Search,
  Trash2,
  Truck,
} from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { VehiclesFacade } from './store/vehicles.facade';
import { AuthFacade } from '../../store/auth/auth.facade';
import { VehicleFormModal } from './components/vehicle-form-modal/vehicle-form-modal';
import { VehicleDocumentList } from './components/vehicle-document-list/vehicle-document-list';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { Spinner } from '../../shared/components/spinner/spinner';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { Vehicle, VehicleForm } from '../../shared/models/vehicle.model';
import {
  VehicleDateStatus,
  formatVehicleDate,
  vehicleDateStatus,
  vehicleRevisionStatus,
} from '../../shared/utils/vehicle-status.utils';

const MODEL_SECTIONS = [
  { key: 'citan', label: 'FLEET.MODEL_CITAN' },
  { key: 'vito', label: 'FLEET.MODEL_VITO' },
  { key: 'navara', label: 'FLEET.MODEL_NAVARA' },
];

@Component({
  selector: 'app-fleet-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    TranslatePipe,
    Spinner,
    ConfirmDialog,
    VehicleFormModal,
    VehicleDocumentList,
    PageHero,
  ],
  templateUrl: './fleet-page.html',
  styleUrl: './fleet-page.scss',
})
export class FleetPage implements OnInit {
  private destroyRef = inject(DestroyRef);
  protected facade = inject(VehiclesFacade);
  private authFacade = inject(AuthFacade);

  isLoading$ = this.facade.isLoading$;
  vehicles$ = this.facade.vehicles$;
  isAdmin$ = this.authFacade.isAdmin$;

  readonly sections = MODEL_SECTIONS;
  readonly plus = Plus;
  readonly search = Search;
  readonly truck = Truck;
  readonly bus = Bus;
  readonly car = Car;
  readonly chevronDown = ChevronDown;
  readonly alertCircle = AlertCircle;
  readonly edit2 = Edit2;
  readonly fileText = FileText;
  readonly trash2 = Trash2;

  showAddModal = signal(false);
  editingVehicle = signal<Vehicle | null>(null);
  deletingVehicle = signal<Vehicle | null>(null);
  docVehicle = signal<Vehicle | null>(null);
  rawSearch = signal('');
  filterBrand = signal('');
  collapsedSections = signal(new Set<string>());

  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        if (term.trim()) {
          this.facade.search(term.trim());
        } else {
          this.facade.loadAll();
        }
      });
  }

  onSearch(value: string): void {
    this.rawSearch.set(value);
    this.searchSubject.next(value);
  }

  vehiclesBySection(vehicles: Vehicle[], model: string): Vehicle[] {
    return vehicles.filter((v) => {
      if (v.model !== model) return false;
      if (this.filterBrand() && v.brand !== this.filterBrand()) return false;
      return true;
    });
  }

  toggleSection(key: string): void {
    this.collapsedSections.update((set) => {
      const next = new Set(set);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  isSectionCollapsed(key: string): boolean {
    return this.collapsedSections().has(key);
  }

  formatDate(date: string | Date | undefined): string {
    return formatVehicleDate(date);
  }

  dateStatus(date: string | Date | undefined): VehicleDateStatus {
    return vehicleDateStatus(date);
  }

  revisionStatus(date: string | Date | undefined): VehicleDateStatus {
    return vehicleRevisionStatus(date);
  }

  badge(format: string): { css: string; label: string; icon: LucideIconData } {
    const map: Record<string, { css: string; label: string; icon: LucideIconData }> = {
      van: { css: 'badge badge--blue', label: 'FLEET.FORMAT_UTILITAIRE', icon: this.truck },
      truck: { css: 'badge badge--orange', label: 'FLEET.FORMAT_CAMION', icon: this.bus },
      pickup: { css: 'badge badge--green', label: 'FLEET.FORMAT_PICKUP', icon: this.car },
    };
    return map[format] ?? { css: 'badge', label: format, icon: this.truck };
  }

  openAdd(): void {
    this.editingVehicle.set(null);
    this.showAddModal.set(true);
  }

  openEdit(vehicle: Vehicle): void {
    this.editingVehicle.set(vehicle);
    this.showAddModal.set(true);
  }

  closeModal(): void {
    this.showAddModal.set(false);
    this.editingVehicle.set(null);
  }

  onSave(payload: { id?: string; data: VehicleForm }): void {
    if (payload.id) {
      this.facade.update(payload.id, payload.data);
    } else {
      this.facade.create(payload.data);
    }
    this.closeModal();
  }

  openDeleteConfirm(vehicle: Vehicle): void {
    this.deletingVehicle.set(vehicle);
  }

  confirmDelete(): void {
    const v = this.deletingVehicle();
    if (v?._id) {
      this.facade.delete(v._id);
    }
    this.deletingVehicle.set(null);
  }

  openDocuments(vehicle: Vehicle): void {
    this.docVehicle.set(vehicle);
  }

  onUploadDocument(payload: { id: string; formData: FormData }): void {
    this.facade.uploadDocument(payload.id, payload.formData);
  }

  onDeleteDocument(payload: { vehicleId: string; docId: string }): void {
    this.facade.deleteDocument(payload.vehicleId, payload.docId);
  }
}
