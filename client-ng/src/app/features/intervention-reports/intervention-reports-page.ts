import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, FolderOpen } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InterventionReportsFacade } from './store/intervention-reports.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { InterventionReport } from '../../shared/models/intervention-report.model';

@Component({
  selector: 'app-intervention-reports-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe, Spinner, PageHero],
  templateUrl: './intervention-reports-page.html',
  styleUrl: './intervention-reports-page.scss',
})
export class InterventionReportsPage implements OnInit {
  protected facade = inject(InterventionReportsFacade);
  private router = inject(Router);

  isLoading$ = this.facade.isLoading$;
  reports$ = this.facade.reports$;

  readonly search = Search;
  readonly folderOpen = FolderOpen;

  searchTerm = signal('');

  ngOnInit(): void {
    this.facade.loadAll();
  }

  filter(reports: InterventionReport[]): InterventionReport[] {
    const searchTerm = this.searchTerm().toLowerCase().trim();
    if (!searchTerm) return reports;
    return reports.filter((report) => {
      const clientFile = report.clientFile;
      if (typeof clientFile === 'object' && clientFile !== null) {
        return (
          clientFile.nom?.toLowerCase().includes(searchTerm) ||
          clientFile.societe?.toLowerCase().includes(searchTerm) ||
          clientFile.ville?.toLowerCase().includes(searchTerm)
        );
      }
      return String(clientFile).toLowerCase().includes(searchTerm);
    });
  }

  getClientLabel(report: InterventionReport): string {
    const clientFile = report.clientFile;
    if (typeof clientFile === 'object' && clientFile !== null) {
      return [clientFile.nom, clientFile.societe].filter(Boolean).join(' - ');
    }
    return String(clientFile ?? '');
  }

  getClientFileId(report: InterventionReport): string | null {
    const clientFile = report.clientFile;
    if (typeof clientFile === 'object' && clientFile !== null) return clientFile._id;
    return typeof clientFile === 'string' ? clientFile : null;
  }

  openClientFile(report: InterventionReport): void {
    const id = this.getClientFileId(report);
    if (id) this.router.navigate(['/client-files', id]);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
