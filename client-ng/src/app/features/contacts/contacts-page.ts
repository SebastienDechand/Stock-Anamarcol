import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ContactsFacade } from './store/facade/contacts.facade';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { ContactCard } from './components/contact-card/contact-card';
import { ContactModal } from './components/contact-modal/contact-modal';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { Contact } from '../../shared/models/contact/contact.model';

@Component({
  selector: 'app-contacts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private selectedContact = toSignal(this.facade.selectedContact$, {
    initialValue: null as Contact | null,
  });
  private openedContact = signal<Contact | null>(null);

  // Shows the just-clicked contact immediately (no stale data from a previously
  // edited contact while `loadOne` is in flight), then switches to the store's
  // copy once it catches up for this same contact so later updates (e.g. a
  // picture upload) are reflected live without needing to reopen the modal.
  editingContact = computed(() => {
    const opened = this.openedContact();
    if (!opened) return null;
    const stored = this.selectedContact();
    return stored?._id === opened._id ? stored : opened;
  });

  ngOnInit() {}

  openModal(contact: Contact) {
    this.facade.loadOne(contact._id);
    this.openedContact.set(contact);
  }

  onSave(data: Partial<Contact>) {
    const contact = this.editingContact();
    if (contact) {
      this.facade.update(contact._id, data);
      this.openedContact.set(null);
    }
  }

  onPictureUpload(event: { id: string; formData: FormData }) {
    this.facade.uploadPicture(event.id, event.formData);
  }

  closeModal() {
    this.openedContact.set(null);
  }
}
