import { Component, DestroyRef, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { LucideAngularModule, X, Archive, AlertTriangle, Download } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../../../core/http/api.service';
import { ToastService } from '../../../../core/toast/toast.service';
import { ShipmentArchive } from '../../../../shared/models/shipment.model';

@Component({
  selector: 'app-shipment-history-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './shipment-history-modal.html',
  styleUrl: './shipment-history-modal.scss',
})
export class ShipmentHistoryModal implements OnInit {
  closed = output<void>();
  archived = output<void>();

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly x = X;
  readonly archiveIcon = Archive;
  readonly alertTriangle = AlertTriangle;
  readonly download = Download;

  archives = signal<ShipmentArchive[]>([]);
  loading = signal(true);
  archiving = signal(false);
  showConfirm = signal(false);

  ngOnInit(): void {
    this.fetchArchives();
  }

  private fetchArchives(): void {
    this.loading.set(true);
    this.api
      .get<ShipmentArchive[]>('api/shipments/archives')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (archives) => {
          this.archives.set(archives ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  handleArchive(): void {
    this.showConfirm.set(false);
    this.archiving.set(true);
    this.api
      .post<ShipmentArchive>('api/shipments/archive', {})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('TOAST.SHIPMENT_ARCHIVED');
          this.archiving.set(false);
          this.fetchArchives();
          this.archived.emit();
        },
        error: () => {
          this.toast.error('TOAST.SHIPMENT_ARCHIVE_ERROR');
          this.archiving.set(false);
        },
      });
  }

  handleDownload(archive: ShipmentArchive, format: 'pdf' | 'xlsx'): void {
    this.api
      .getBlob(`api/shipments/archives/${archive._id}/download`, { format })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          const safeTitle = archive.title.replace(/[^a-zA-Z0-9àâéèêëïîôùûüç\s-]/g, '');
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `shipments-${safeTitle}.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        },
        error: () => this.toast.error('TOAST.SHIPMENT_ARCHIVE_DOWNLOAD_ERROR'),
      });
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
