import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddMemberModal } from './add-member-modal';

describe('AddMemberModal', () => {
  let component: AddMemberModal;

  beforeEach(async () => {
    TestBed.overrideComponent(AddMemberModal, { set: { template: '', imports: [] } });
    await TestBed.configureTestingModule({ imports: [AddMemberModal] }).compileComponents();

    const fixture = TestBed.createComponent(AddMemberModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillValid(): void {
    component.form.setValue({
      username: 'jdupont',
      email: 'jdupont@example.com',
      password: 'secret123',
      position: '',
      phone: '',
      department: '',
    });
  }

  describe('submit()', () => {
    it('does not emit and marks the form touched when required fields are blank', () => {
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
      expect(component.form.controls.username.touched).toBe(true);
    });

    it('does not emit when username is whitespace-only', () => {
      fillValid();
      component.form.controls.username.setValue('   ');
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not emit when the email format is invalid', () => {
      fillValid();
      component.form.controls.email.setValue('not-an-email');
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('does not emit when the phone format is invalid', () => {
      fillValid();
      component.form.controls.phone.setValue('123');
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).not.toHaveBeenCalled();
    });

    it('emits the form value when every field is valid', () => {
      fillValid();
      const spy = vi.fn();
      component.submitted.subscribe(spy);

      component.submit();

      expect(spy).toHaveBeenCalledWith(component.form.getRawValue());
    });
  });
});
