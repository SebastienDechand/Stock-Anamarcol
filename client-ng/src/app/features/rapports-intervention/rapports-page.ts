import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Search, FolderOpen } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { RapportsFacade } from './store/rapports.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { InterventionReport } from '../../shared/models/intervention-report.model';

@Component({
  selector: 'app-rapports-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe, Spinner, PageHero],
  templateUrl: './rapports-page.html',
  styleUrl: './rapports-page.scss',
})
export class RapportsPage implements OnInit {
  protected facade = inject(RapportsFacade);
  private router = inject(Router);

  isLoading$ = this.facade.isLoading$;
  rapports$ = this.facade.rapports$;

  readonly search = Search;
  readonly folderOpen = FolderOpen;

  searchTerm = signal('');

  ngOnInit(): void {
    this.facade.loadAll();
  }

  filter(rapports: InterventionReport[]): InterventionReport[] {
    const searchTerm = this.searchTerm().toLowerCase().trim();
    if (!searchTerm) return rapports;
    return rapports.filter((rapport) => {
      const clientFile = rapport.clientFile;
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

  getClientLabel(rapport: InterventionReport): string {
    const clientFile = rapport.clientFile;
    if (typeof clientFile === 'object' && clientFile !== null) {
      return [clientFile.nom, clientFile.societe].filter(Boolean).join(' - ');
    }
    return String(clientFile ?? '');
  }

  getClientFileId(rapport: InterventionReport): string | null {
    const clientFile = rapport.clientFile;
    if (typeof clientFile === 'object' && clientFile !== null) return clientFile._id;
    return typeof clientFile === 'string' ? clientFile : null;
  }

  openDossier(rapport: InterventionReport): void {
    const id = this.getClientFileId(rapport);
    if (id) this.router.navigate(['/fiches-clients', id]);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
