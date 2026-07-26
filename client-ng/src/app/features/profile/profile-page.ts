import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { UsersFacade } from '../members/store/facade/users.facade';
import { DateFrPipe } from '../../shared/pipes/date-fr/date-fr.pipe';
import { User } from '../../shared/models/user/user.model';
import { Vehicle } from '../../shared/models/vehicle/vehicle.model';
import { VehiclesFacade } from '../fleet/store/facade/vehicles.facade';
import { MAX_FILE_SIZE } from '../../shared/constants';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { DEPARTMENT_LABEL_KEYS } from '../../shared/constants/poles/poles.constants';
import { VEHICLE_FORMAT_LABEL_KEYS } from '../../shared/utils/vehicle-status/vehicle-status.utils';

@Component({
  selector: 'app-profile-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe, DateFrPipe, PageHero],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
})
export class ProfilePage implements OnInit {
  private authFacade = inject(AuthFacade);
  private usersFacade = inject(UsersFacade);
  private destroyRef = inject(DestroyRef);
  private vehiclesFacade = inject(VehiclesFacade);
  private translate = inject(TranslateService);

  user = toSignal(this.authFacade.user$, { initialValue: null as User | null });
  private vehicles = toSignal(this.vehiclesFacade.vehicles$, { initialValue: [] as Vehicle[] });

  editingPhone = signal(false);
  phone = signal('');
  uploadError = signal('');

  assignedVehicle = computed(() => {
    const currentUser = this.user();
    if (!currentUser) return null;
    return (
      this.vehicles().find((vehicle) => {
        const id =
          typeof vehicle.assignedTo === 'object' ? vehicle.assignedTo?._id : vehicle.assignedTo;
        return id === currentUser._id;
      }) ?? null
    );
  });

  departmentLabelKeys = DEPARTMENT_LABEL_KEYS;
  vehicleFormatLabelKeys = VEHICLE_FORMAT_LABEL_KEYS;

  ngOnInit() {
    this.vehiclesFacade.loadAll();

    this.authFacade.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((currentUser) => {
      this.phone.set(currentUser?.phone ?? '');
    });
  }

  get avatarUrl(): string {
    const picture = this.user()?.picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.user()?.username || '?')[0].toUpperCase();
  }

  vehicleIcon(vehicle: Vehicle): string {
    switch (vehicle.format) {
      case 'van':
        return 'truck';
      case 'truck':
        return 'bus';
      case 'pickup':
        return 'car';
      default:
        return 'truck';
    }
  }

  savePhone() {
    const user = this.user();
    if (!user) return;
    this.authFacade.updateProfile(user._id, { phone: this.phone() });
    this.editingPhone.set(false);
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploadError.set('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.uploadError.set(this.translate.instant('PROFILE.IMAGE_FORMAT_ERROR'));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.uploadError.set(this.translate.instant('PROFILE.IMAGE_SIZE_ERROR'));
      return;
    }

    const user = this.user();
    if (!user) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', user.username);
    formData.append('userId', user._id);

    this.usersFacade.uploadPicture(user._id, formData);
    this.authFacade.updateProfile(user._id, {});
  }
}
