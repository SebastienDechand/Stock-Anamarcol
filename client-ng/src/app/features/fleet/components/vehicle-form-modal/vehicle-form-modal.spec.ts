import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { VehicleFormModal } from './vehicle-form-modal';
import { UsersFacade } from '../../../members/store/facade/users.facade';
import type { Vehicle } from '../../../../shared/models/vehicle/vehicle.model';

const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  _id: 'v1',
  brand: 'mercedes',
  model: 'vito',
  format: 'truck',
  licensePlate: 'AB-123-CD',
  documents: [],
  ...overrides,
});

function buildComponent(): {
  component: VehicleFormModal;
  fixture: ReturnType<typeof TestBed.createComponent<VehicleFormModal>>;
} {
  TestBed.overrideComponent(VehicleFormModal, { set: { template: '', imports: [] } });
  TestBed.configureTestingModule({
    imports: [VehicleFormModal],
    providers: [{ provide: UsersFacade, useValue: { users$: of([]) } }],
  });
  const fixture = TestBed.createComponent(VehicleFormModal);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture };
}

describe('VehicleFormModal', () => {
  describe('ngOnChanges()', () => {
    it('resets the form to defaults when there is no vehicle', () => {
      const { component } = buildComponent();
      expect(component.form.brand).toBe('mercedes');
      expect(component.licensePlateControl.value).toBe('');
    });

    it('populates the form and license plate from the given vehicle', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('vehicle', makeVehicle());
      fixture.detectChanges();

      expect(component.licensePlateControl.value).toBe('AB-123-CD');
      expect(component.form.brand).toBe('mercedes');
      expect(component.form.model).toBe('vito');
      expect(component.form.format).toBe('truck');
    });

    it('updates the available models/formats to match the loaded vehicle', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('vehicle', makeVehicle({ brand: 'nissan', model: 'navara' }));
      fixture.detectChanges();

      expect(component.availableModels).toEqual(['navara']);
      expect(component.availableFormats).toEqual(['pickup']);
    });
  });

  describe('isEdit', () => {
    it('is false when there is no vehicle', () => {
      const { component } = buildComponent();
      expect(component.isEdit).toBe(false);
    });

    it('is true when a vehicle is set', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('vehicle', makeVehicle());
      fixture.detectChanges();
      expect(component.isEdit).toBe(true);
    });
  });

  describe('onBrandChange() / onModelChange()', () => {
    it('resets model and format to the first option of the new brand', () => {
      const { component } = buildComponent();
      component.form.brand = 'nissan';
      component.onBrandChange();

      expect(component.availableModels).toEqual(['navara']);
      expect(component.form.model).toBe('navara');
      expect(component.availableFormats).toEqual(['pickup']);
      expect(component.form.format).toBe('pickup');
    });

    it('resets format to the first option of the new model', () => {
      const { component } = buildComponent();
      component.form.model = 'vito';
      component.onModelChange();

      expect(component.availableFormats).toEqual(['van', 'truck']);
      expect(component.form.format).toBe('van');
    });
  });

  describe('onCtInspectionChange()', () => {
    it('auto-computes the expiry date as 2 years after the inspection date', () => {
      const { component } = buildComponent();
      component.onCtInspectionChange('2026-01-15');
      expect(component.form.inspectionDate).toBe('2026-01-15');
      expect(component.form.inspectionExpiryDate).toBe('2028-01-15');
    });
  });

  describe('onAntiPollutionInspectionChange()', () => {
    it('auto-computes the expiry date as 2 years after the inspection date', () => {
      const { component } = buildComponent();
      component.onAntiPollutionInspectionChange('2026-03-01');
      expect(component.form.antiPollutionInspectionDate).toBe('2026-03-01');
      expect(component.form.antiPollutionExpiryDate).toBe('2028-03-01');
    });
  });

  describe('submit()', () => {
    it('does not emit and marks the plate control touched when the license plate is invalid', () => {
      const { component } = buildComponent();
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.licensePlateControl.touched).toBe(true);
    });

    it('emits save with the form data and the license plate when valid (create)', () => {
      const { component } = buildComponent();
      component.licensePlateControl.setValue('AB-123-CD');
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.submit();

      expect(spy).toHaveBeenCalledWith({
        id: undefined,
        data: expect.objectContaining({ licensePlate: 'AB-123-CD', brand: 'mercedes' }),
      });
    });

    it('emits save with the vehicle id when editing', () => {
      const { component, fixture } = buildComponent();
      fixture.componentRef.setInput('vehicle', makeVehicle({ _id: 'v42' }));
      fixture.detectChanges();
      const spy = vi.fn();
      component.save.subscribe(spy);

      component.submit();

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'v42' }));
    });
  });
});
