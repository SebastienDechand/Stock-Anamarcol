import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Contact } from '../../../../shared/models/contact/contact.model';

@Component({
  selector: 'app-contact-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './contact-card.html',
  styleUrl: './contact-card.scss',
})
export class ContactCard {
  contact = input.required<Contact>();
  clickable = input(false);
  selected = output<Contact>();

  get initials(): string {
    return (this.contact().name ?? '?')[0].toUpperCase();
  }

  get avatarUrl(): string {
    const picture = this.contact().picture;
    if (!picture) return '';
    if (picture.startsWith('http') || picture.startsWith('/')) return picture;
    return `/${picture}`;
  }
}
