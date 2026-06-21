import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthFacade } from '../../store/auth/auth.facade';
import { UsersFacade } from '../membres/store/users.facade';
import { DateFrPipe } from '../../shared/pipes/date-fr.pipe';
import { User } from '../../shared/models/user.model';
import { Vehicle } from '../../shared/models/vehicle.model';
import { VehiclesFacade } from '../flotte/store/vehicles.facade';
import { MAX_FILE_SIZE } from '../../shared/constants';
import { PageHero } from '../../shared/components/page-hero/page-hero';

@Component({
  selector: 'app-profil-page',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe, DateFrPipe, PageHero],
  templateUrl: './profil-page.html',
  styleUrl: './profil-page.scss',
})
export class ProfilPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private usersFacade = inject(UsersFacade);
  private destroyRef = inject(DestroyRef);
  private vehiclesFacade = inject(VehiclesFacade);
  private translate = inject(TranslateService);

  user = signal<User | null>(null);
  editingNumero = signal(false);
  numero = signal('');
  uploadError = signal('');
  assignedVehicle = signal<Vehicle | null>(null);

  ngOnInit() {
    this.vehiclesFacade.loadAll();

    combineLatest([this.authFacade.user$, this.vehiclesFacade.vehicles$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([currentUser, vehicles]) => {
        this.user.set(currentUser);
        this.numero.set(currentUser?.numero ?? '');
        this.assignedVehicle.set(
          currentUser
            ? (vehicles.find((vehicle) => {
                const id =
                  typeof vehicle.assignedTo === 'object'
                    ? vehicle.assignedTo?._id
                    : vehicle.assignedTo;
                return id === currentUser._id;
              }) ?? null)
            : null,
        );
      });
  }

  get avatarUrl(): string {
    const picture = this.user()?.picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.user()?.pseudo ?? '?')[0].toUpperCase();
  }

  vehicleIcon(vehicle: Vehicle): string {
    switch (vehicle.format) {
      case 'utilitaire':
        return 'truck';
      case 'camion':
        return 'bus';
      case 'pickup':
        return 'car';
      default:
        return 'truck';
    }
  }

  saveNumero() {
    const user = this.user();
    if (!user) return;
    this.authFacade.updateProfile(user._id, { numero: this.numero() });
    this.editingNumero.set(false);
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
    formData.append('name', user.pseudo);
    formData.append('userId', user._id);

    this.usersFacade.uploadPicture(user._id, formData);
    this.authFacade.updateProfile(user._id, {});
  }
}
