import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Contact, ContactCategory } from '../../../../shared/models/contact/contact.model';
import {
  phoneFormatValidator,
  requiredTrimmedValidator,
} from '../../../../shared/utils/validators/validators.utils';

@Component({
  selector: 'app-contact-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './contact-modal.html',
  styleUrl: './contact-modal.scss',
})
export class ContactModal implements OnInit {
  private fb = inject(FormBuilder);

  contact = input.required<Contact>();
  saved = output<Partial<Contact>>();
  pictureUploaded = output<{ id: string; formData: FormData }>();
  cancelled = output<void>();

  form = this.fb.nonNullable.group({
    name: ['', requiredTrimmedValidator],
    email: ['', Validators.email],
    phone: ['', phoneFormatValidator],
    position: [''],
    link: [''],
    category: ['external' as ContactCategory],
  });

  ngOnInit() {
    this.form.setValue({
      name: this.contact().name ?? '',
      email: this.contact().email ?? '',
      phone: this.contact().phone ?? '',
      position: this.contact().position ?? '',
      link: this.contact().link ?? '',
      category: this.contact().category ?? 'external',
    });
  }

  get avatarUrl(): string {
    const picture = this.contact().picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.contact().name || '?')[0].toUpperCase();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contactId', this.contact()._id);
    this.pictureUploaded.emit({ id: this.contact()._id, formData });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
