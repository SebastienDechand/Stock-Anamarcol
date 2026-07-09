import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FOURNISSEURS, ETATS } from '../../../../shared/constants';
import { togglePrepaFilter } from '../../../../shared/utils/prepa-filter.utils';

export interface FiltersApplied {
  fournisseurs: string[];
  etats: string[];
  prepaCG: boolean;
  prepaTPV: boolean;
}

@Component({
  selector: 'app-filters-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslatePipe],
  templateUrl: './filters-modal.html',
  styleUrl: './filters-modal.scss',
})
export class FiltersModal implements OnInit {
  @Input() selectedFournisseurs: string[] = [];
  @Input() selectedEtats: string[] = [];
  @Input() prepaCG = false;
  @Input() prepaTPV = false;

  @Output() applied = new EventEmitter<FiltersApplied>();
  @Output() cancelled = new EventEmitter<void>();

  readonly fournisseurs = FOURNISSEURS;
  readonly etats = ETATS;

  // ─── Local State ────────────────────────────────────
  localFournisseurs = signal<string[]>([]);
  localEtats = signal<string[]>([]);
  localPrepaCG = signal(false);
  localPrepaTPV = signal(false);

  // ─── Side Effects ────────────────────────────────────
  ngOnInit() {
    this.localFournisseurs.set([...this.selectedFournisseurs]);
    this.localEtats.set([...this.selectedEtats]);
    this.localPrepaCG.set(this.prepaCG);
    this.localPrepaTPV.set(this.prepaTPV);
  }

  // ─── Handlers ────────────────────────────────────────
  toggleFournisseur(fournisseur: string) {
    const current = this.localFournisseurs();
    this.localFournisseurs.set(
      current.includes(fournisseur)
        ? current.filter((item) => item !== fournisseur)
        : [...current, fournisseur],
    );
  }

  toggleEtat(etat: string) {
    const current = this.localEtats();
    this.localEtats.set(
      current.includes(etat) ? current.filter((item) => item !== etat) : [...current, etat],
    );
  }

  togglePrepa(prepa: 'CashGuard' | 'Caisse TPV') {
    const next = togglePrepaFilter(
      { prepaCG: this.localPrepaCG(), prepaTPV: this.localPrepaTPV() },
      prepa,
    );
    this.localPrepaCG.set(next.prepaCG);
    this.localPrepaTPV.set(next.prepaTPV);
  }

  reset() {
    this.localFournisseurs.set([]);
    this.localEtats.set([]);
    this.localPrepaCG.set(false);
    this.localPrepaTPV.set(false);
  }

  apply() {
    this.applied.emit({
      fournisseurs: this.localFournisseurs(),
      etats: this.localEtats(),
      prepaCG: this.localPrepaCG(),
      prepaTPV: this.localPrepaTPV(),
    });
  }
}
