import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { ShipmentCard } from './shipment-card';
import { LanguageService } from '../../../../core/services/language/language.service';
import type { Shipment } from '../../../../shared/models/shipment/shipment.model';

const makeShipment = (overrides: Partial<Shipment> = {}): Shipment => ({
  _id: '1',
  lastName: 'Dupont',
  firstName: 'Jean',
  address: '1 rue de la Paix',
  postalCode: '75000',
  city: 'Paris',
  companyOrRole: '',
  company: '',
  part: 'Carte mère',
  ...overrides,
});

function buildComponent(lang: 'fr' | 'en' = 'fr'): ShipmentCard {
  TestBed.overrideComponent(ShipmentCard, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [ShipmentCard],
    providers: [{ provide: LanguageService, useValue: { current: lang } }],
  });
  const fixture = TestBed.createComponent(ShipmentCard);
  fixture.componentRef.setInput('shipment', makeShipment());
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('ShipmentCard', () => {
  describe('formatDate()', () => {
    it('returns "-" when the date is undefined', () => {
      expect(buildComponent().formatDate(undefined)).toBe('-');
    });

    it('formats a date using the fr-FR locale', () => {
      const result = buildComponent('fr').formatDate('2026-03-15');
      expect(result).toMatch(/2026/);
    });

    it('formats a date using the en-GB locale', () => {
      const result = buildComponent('en').formatDate('2026-03-15');
      expect(result).toMatch(/2026/);
    });
  });
});
