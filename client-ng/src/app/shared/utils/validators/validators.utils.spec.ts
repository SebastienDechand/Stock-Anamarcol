import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import {
  licensePlateFormatValidator,
  phoneFormatValidator,
  requiredTrimmedValidator,
} from './validators.utils';

describe('requiredTrimmedValidator', () => {
  it('should reject empty and whitespace-only values', () => {
    expect(requiredTrimmedValidator(new FormControl(''))).toEqual({ required: true });
    expect(requiredTrimmedValidator(new FormControl('   '))).toEqual({ required: true });
    expect(requiredTrimmedValidator(new FormControl(null))).toEqual({ required: true });
  });

  it('should accept a non-blank value', () => {
    expect(requiredTrimmedValidator(new FormControl('Jean'))).toBeNull();
    expect(requiredTrimmedValidator(new FormControl('  Jean  '))).toBeNull();
  });
});

describe('phoneFormatValidator', () => {
  it('should return null for an empty value (presence is handled by Validators.required separately)', () => {
    expect(phoneFormatValidator(new FormControl(''))).toBeNull();
    expect(phoneFormatValidator(new FormControl(null))).toBeNull();
  });

  it('should accept valid French phone numbers in common formats', () => {
    expect(phoneFormatValidator(new FormControl('06 12 34 56 78'))).toBeNull();
    expect(phoneFormatValidator(new FormControl('0612345678'))).toBeNull();
    expect(phoneFormatValidator(new FormControl('06.12.34.56.78'))).toBeNull();
    expect(phoneFormatValidator(new FormControl('06-12-34-56-78'))).toBeNull();
    expect(phoneFormatValidator(new FormControl('+33 6 12 34 56 78'))).toBeNull();
    expect(phoneFormatValidator(new FormControl('+33612345678'))).toBeNull();
  });

  it('should reject values with the wrong digit count', () => {
    expect(phoneFormatValidator(new FormControl('06 12 34 56'))).toEqual({
      phoneFormat: true,
    });
    expect(phoneFormatValidator(new FormControl('06 12 34 56 78 90'))).toEqual({
      phoneFormat: true,
    });
  });

  it('should reject values containing letters', () => {
    expect(phoneFormatValidator(new FormControl('06 12 34 56 7a'))).toEqual({
      phoneFormat: true,
    });
  });
});

describe('licensePlateFormatValidator', () => {
  it('should return null for an empty value (presence is handled by Validators.required separately)', () => {
    expect(licensePlateFormatValidator(new FormControl(''))).toBeNull();
    expect(licensePlateFormatValidator(new FormControl(null))).toBeNull();
  });

  it('should accept a valid SIV-format plate, uppercase or lowercase', () => {
    expect(licensePlateFormatValidator(new FormControl('AB-123-CD'))).toBeNull();
    expect(licensePlateFormatValidator(new FormControl('ab-123-cd'))).toBeNull();
  });

  it('should reject the old FNI format (no dashes)', () => {
    expect(licensePlateFormatValidator(new FormControl('1234 AB 56'))).toEqual({
      licensePlateFormat: true,
    });
  });

  it('should reject a malformed plate', () => {
    expect(licensePlateFormatValidator(new FormControl('AB-12-CD'))).toEqual({
      licensePlateFormat: true,
    });
    expect(licensePlateFormatValidator(new FormControl('ABC-123-CD'))).toEqual({
      licensePlateFormat: true,
    });
  });
});
