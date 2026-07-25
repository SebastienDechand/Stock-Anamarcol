import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ContactsFacade } from './store/facade/contacts.facade';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ContactCard } from './components/contact-card/contact-card';
import { ContactModal } from './components/contact-modal/contact-modal';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { Contact } from '../../shared/models/contact/contact.model';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    Spinner,
    ContactCard,
    ContactModal,
    PageHero,
    TranslatePipe,
  ],
  templateUrl: './contacts-page.html',
  styleUrl: './contacts-page.scss',
})
export class ContactsPage implements OnInit {
  protected facade = inject(ContactsFacade);
  private authFacade = inject(AuthFacade);

  isLoading$ = this.facade.isLoading$;
  exterieurs$ = this.facade.exterieurs$;
  fournisseurs$ = this.facade.fournisseurs$;
  isAdmin$ = this.authFacade.isAdmin$;

  editingContact = signal<Contact | null>(null);

  ngOnInit() {}

  openModal(contact: Contact) {
    this.facade.loadOne(contact._id);
    this.editingContact.set(contact);
  }

  onSave(data: Partial<Contact>) {
    const contact = this.editingContact();
    if (contact) {
      this.facade.update(contact._id, data);
      this.editingContact.set(null);
    }
  }

  onPictureUpload(event: { id: string; formData: FormData }) {
    this.facade.uploadPicture(event.id, event.formData);
  }
}
