import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export enum ValidationErrorKey {
  Required = 'required',
  PhoneFormat = 'phoneFormat',
  LicensePlateFormat = 'licensePlateFormat',
}

// Angular's built-in Validators.required only checks value.length === 0, so '   ' passes it.
// Uses the same 'required' key so existing Validators.required-based checks keep working.
export const requiredTrimmedValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = control.value;
  const isBlank = typeof value === 'string' ? value.trim().length === 0 : !value;
  return isBlank ? { [ValidationErrorKey.Required]: true } : null;
};

function patternFormatValidator(pattern: RegExp, errorKey: ValidationErrorKey): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').trim();
    if (!value) return null;
    return pattern.test(value) ? null : { [errorKey]: true };
  };
}

const FRENCH_PHONE_PATTERN = /^(?:\+33|0)[\s.-]?[1-9](?:[\s.-]?\d{2}){4}$/;
const FRENCH_LICENSE_PLATE_PATTERN = /^[A-Za-z]{2}-\d{3}-[A-Za-z]{2}$/;

export const phoneFormatValidator = patternFormatValidator(
  FRENCH_PHONE_PATTERN,
  ValidationErrorKey.PhoneFormat,
);

export const licensePlateFormatValidator = patternFormatValidator(
  FRENCH_LICENSE_PLATE_PATTERN,
  ValidationErrorKey.LicensePlateFormat,
);
