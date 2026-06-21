import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { provideMockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { FichesClientsPage } from '../fiches-clients-page';
import { ClientFilesFacade } from '../store/client-files.facade';
import { initialClientFilesState } from '../store/client-files.state';
import { initialAuthState } from '../../../store/auth/auth.state';
import { ClientFile, ClientFileForm } from '../../../shared/models/client-file.model';

const initialState = { clientFiles: initialClientFilesState, auth: initialAuthState };

const makeFile = (overrides: Partial<ClientFile> = {}): ClientFile => ({
  _id: 'file-1',
  nom: 'Dupont',
  prenom: 'Jean',
  visitePreinstallation: false,
  saisirFichierProduit: false,
  decoupePlanMenuiserie: false,
  decoupePlanMarbrerie: false,
  equipement: {
    nbCashguard: 0,
    nbFusion: 0,
    nbCaisses: 0,
    nbAutresMateriels: 0,
    nbBalancesCaisses: 0,
    licencesTactis: 0,
    licencesInno: 0,
    pcBackoffice: 0,
    pcCentralisation: 0,
    borneAllergene: false,
    borneCommande: false,
    etiquettesElectronique: false,
    carteFidelite: false,
  },
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  ...overrides,
});

const makeForm = (overrides: Partial<ClientFileForm> = {}): ClientFileForm => {
  const base: ClientFileForm = {
    nom: 'Dupont',
    prenom: 'Jean',
    visitePreinstallation: false,
    saisirFichierProduit: false,
    decoupePlanMenuiserie: false,
    decoupePlanMarbrerie: false,
    equipement: {
      nbCashguard: 0,
      nbFusion: 0,
      nbCaisses: 0,
      nbAutresMateriels: 0,
      nbBalancesCaisses: 0,
      licencesTactis: 0,
      licencesInno: 0,
      pcBackoffice: 0,
      pcCentralisation: 0,
      borneAllergene: false,
      borneCommande: false,
      etiquettesElectronique: false,
      carteFidelite: false,
    },
  };
  return Object.assign(base, overrides);
};

describe('FichesClientsPage', () => {
  let component: FichesClientsPage;
  let facade: ClientFilesFacade;

  beforeEach(async () => {
    TestBed.overrideComponent(FichesClientsPage, { set: { template: '', imports: [] } });

    await TestBed.configureTestingModule({
      imports: [FichesClientsPage],
      providers: [
        provideMockStore({ initialState }),
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    facade = TestBed.inject(ClientFilesFacade);
    vi.spyOn(facade, 'loadAll').mockImplementation(() => {});

    const fixture = TestBed.createComponent(FichesClientsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls facade.loadAll once', () => {
    expect(facade.loadAll).toHaveBeenCalledTimes(1);
  });

  // ─── filter() ────────────────────────────────────────────────────────────────

  describe('filter()', () => {
    it('returns files sorted by nom when no searchTerm', () => {
      const files = [
        makeFile({ _id: '1', nom: 'Martin' }),
        makeFile({ _id: '2', nom: 'Arnaud' }),
        makeFile({ _id: '3', nom: 'Dupont' }),
      ];

      const result = component.filter(files);

      expect(result.map((f) => f.nom)).toEqual(['Arnaud', 'Dupont', 'Martin']);
    });

    it('filters by nom when searchTerm matches', () => {
      const files = [
        makeFile({ _id: '1', nom: 'Martin' }),
        makeFile({ _id: '2', nom: 'Dupont' }),
        makeFile({ _id: '3', nom: 'Bernard' }),
      ];
      component.searchTerm.set('mar');

      const result = component.filter(files);

      expect(result).toHaveLength(1);
      expect(result[0].nom).toBe('Martin');
    });

    it('filters by societe when searchTerm matches', () => {
      const files = [
        makeFile({ _id: '1', nom: 'Dupont', societe: 'SARL Dupont' }),
        makeFile({ _id: '2', nom: 'Martin', societe: 'SAS Martin' }),
        makeFile({ _id: '3', nom: 'Bernard' }),
      ];
      component.searchTerm.set('sarl');

      const result = component.filter(files);

      expect(result).toHaveLength(1);
      expect(result[0].societe).toBe('SARL Dupont');
    });
  });

  // ─── paginate() ───────────────────────────────────────────────────────────────

  describe('paginate()', () => {
    it('returns the first 9 items for page 1', () => {
      const files = Array.from({ length: 15 }, (_, i) => makeFile({ _id: `${i}`, nom: `Nom${i}` }));
      component.currentPage.set(1);

      const result = component.paginate(files);

      expect(result).toHaveLength(9);
      expect(result[0]._id).toBe('0');
      expect(result[8]._id).toBe('8');
    });

    it('returns the correct slice for page 2', () => {
      const files = Array.from({ length: 15 }, (_, i) => makeFile({ _id: `${i}`, nom: `Nom${i}` }));
      component.currentPage.set(2);

      const result = component.paginate(files);

      expect(result).toHaveLength(6);
      expect(result[0]._id).toBe('9');
      expect(result[5]._id).toBe('14');
    });
  });

  // ─── totalPages() ─────────────────────────────────────────────────────────────

  describe('totalPages()', () => {
    it('returns 1 for 9 or fewer items', () => {
      const files = Array.from({ length: 9 }, (_, i) => makeFile({ _id: `${i}`, nom: `Nom${i}` }));
      expect(component.totalPages(files)).toBe(1);
    });

    it('returns 1 for an empty list', () => {
      expect(component.totalPages([])).toBe(0);
    });

    it('returns 2 for 10 items', () => {
      const files = Array.from({ length: 10 }, (_, i) => makeFile({ _id: `${i}`, nom: `Nom${i}` }));
      expect(component.totalPages(files)).toBe(2);
    });
  });

  // ─── displayName() ────────────────────────────────────────────────────────────

  describe('displayName()', () => {
    it('returns "NOM prenom" when no societe', () => {
      const file = makeFile({ nom: 'dupont', prenom: 'Jean' });
      expect(component.displayName(file)).toBe('DUPONT Jean');
    });

    it('returns "NOM prenom - SARL" when societe is set', () => {
      const file = makeFile({ nom: 'dupont', prenom: 'Jean', societe: 'SARL Dupont' });
      expect(component.displayName(file)).toBe('DUPONT Jean - SARL Dupont');
    });
  });

  // ─── openCreate() ─────────────────────────────────────────────────────────────

  describe('openCreate()', () => {
    it('sets editTarget to null and opens the modal', () => {
      const file = makeFile();
      component.editTarget.set(file);
      component.modalOpen.set(false);

      component.openCreate();

      expect(component.editTarget()).toBeNull();
      expect(component.modalOpen()).toBe(true);
    });
  });

  // ─── onModalClose() ───────────────────────────────────────────────────────────

  describe('onModalClose()', () => {
    it('closes the modal and clears editTarget', () => {
      component.modalOpen.set(true);
      component.editTarget.set(makeFile());

      component.onModalClose();

      expect(component.modalOpen()).toBe(false);
      expect(component.editTarget()).toBeNull();
    });
  });

  // ─── onModalSave() ────────────────────────────────────────────────────────────

  describe('onModalSave()', () => {
    it('calls facade.update and not facade.create when id is provided', () => {
      vi.spyOn(facade, 'update').mockImplementation(() => {});
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      const formData = makeForm({ nom: 'Dupont' });

      component.onModalSave({ id: 'file-1', data: formData });

      expect(facade.update).toHaveBeenCalledWith('file-1', formData);
      expect(facade.create).not.toHaveBeenCalled();
    });

    it('calls facade.create and not facade.update when no id is provided', () => {
      vi.spyOn(facade, 'update').mockImplementation(() => {});
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      const formData = makeForm({ nom: 'Dupont' });

      component.onModalSave({ data: formData });

      expect(facade.create).toHaveBeenCalledWith(formData);
      expect(facade.update).not.toHaveBeenCalled();
    });

    it('closes the modal and clears editTarget after save', () => {
      vi.spyOn(facade, 'create').mockImplementation(() => {});
      component.modalOpen.set(true);
      component.editTarget.set(makeFile());

      component.onModalSave({ data: makeForm() });

      expect(component.modalOpen()).toBe(false);
      expect(component.editTarget()).toBeNull();
    });
  });

  // ─── confirmDelete() ──────────────────────────────────────────────────────────

  describe('confirmDelete()', () => {
    it('calls facade.delete with the file id when deletingFile is set', () => {
      vi.spyOn(facade, 'delete').mockImplementation(() => {});
      const file = makeFile({ _id: 'file-42' });
      component.deletingFile.set(file);

      component.confirmDelete();

      expect(facade.delete).toHaveBeenCalledWith('file-42');
    });

    it('clears deletingFile after confirming', () => {
      vi.spyOn(facade, 'delete').mockImplementation(() => {});
      component.deletingFile.set(makeFile());

      component.confirmDelete();

      expect(component.deletingFile()).toBeNull();
    });

    it('does not call facade.delete when deletingFile is null', () => {
      vi.spyOn(facade, 'delete').mockImplementation(() => {});
      component.deletingFile.set(null);

      component.confirmDelete();

      expect(facade.delete).not.toHaveBeenCalled();
    });
  });

  // ─── onSearchChange() ─────────────────────────────────────────────────────────

  describe('onSearchChange()', () => {
    it('resets currentPage to 1', () => {
      component.currentPage.set(5);

      component.onSearchChange();

      expect(component.currentPage()).toBe(1);
    });
  });
});
