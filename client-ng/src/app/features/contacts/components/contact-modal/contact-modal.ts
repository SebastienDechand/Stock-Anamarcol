import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Contact } from '../../../../shared/models/contact.model';

@Component({
  selector: 'app-contact-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TranslatePipe],
  templateUrl: './contact-modal.html',
  styleUrl: './contact-modal.scss',
})
export class ContactModal implements OnInit {
  @Input({ required: true }) contact!: Contact;
  @Output() saved = new EventEmitter<Partial<Contact>>();
  @Output() pictureUploaded = new EventEmitter<{ id: string; formData: FormData }>();
  @Output() cancelled = new EventEmitter<void>();

  form = { nom: '', email: '', tel: '', poste: '', lien: '' };

  ngOnInit() {
    this.form = {
      nom: this.contact.nom ?? '',
      email: this.contact.email ?? '',
      tel: this.contact.tel ?? '',
      poste: this.contact.poste ?? '',
      lien: this.contact.lien ?? '',
    };
  }

  get avatarUrl(): string {
    const picture = this.contact.picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }

  get initials(): string {
    return (this.contact.nom ?? '?')[0].toUpperCase();
  }

  onFileChange(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('contactId', this.contact._id);
    this.pictureUploaded.emit({ id: this.contact._id, formData });
  }

  submit() {
    this.saved.emit({ ...this.form });
  }
}
