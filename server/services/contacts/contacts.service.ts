import ContactModel, { IContact } from '../../models/contact.model';
import type { HydratedDocument } from 'mongoose';

export type NewContact = Pick<
  IContact,
  'name' | 'email' | 'link' | 'position' | 'phone' | 'category'
>;

export function listContacts() {
  return ContactModel.find();
}

export function findContactById(id: string) {
  return ContactModel.findById(id).lean();
}

export function findContactDocument(id: string): Promise<HydratedDocument<IContact> | null> {
  return ContactModel.findById(id);
}

export function createContact(data: NewContact) {
  return ContactModel.create(data);
}

export function deleteContactById(id: string) {
  return ContactModel.deleteOne({ _id: id }).exec();
}
