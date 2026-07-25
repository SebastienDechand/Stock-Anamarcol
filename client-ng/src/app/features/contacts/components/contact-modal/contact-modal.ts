import { Component, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Contact, ContactCategory } from '../../../../shared/models/contact/contact.model';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './contact-modal.html',
  styleUrl: './contact-modal.scss',
})
export class ContactModal implements OnInit {
  contact = input.required<Contact>();
  saved = output<Partial<Contact>>();
  pictureUploaded = output<{ id: string; formData: FormData }>();
  cancelled = output<void>();

  form = { name: '', email: '', phone: '', position: '', link: '', category: 'external' as ContactCategory };

  ngOnInit() {
    this.form = {
      name: this.contact().name ?? '',
      email: this.contact().email ?? '',
      phone: this.contact().phone ?? '',
      position: this.contact().position ?? '',
      link: this.contact().link ?? '',
      category: this.contact().category ?? 'external',
    };
  }

  get avatarUrl(): string {
    const picture = this.contact().picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.contact().name ?? '?')[0].toUpperCase();
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
    this.saved.emit({ ...this.form });
  }
}
