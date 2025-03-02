import { StudentsCollection } from '../db/models/contacts.js';

export const getContacts = async () => {
  return await StudentsCollection.find();
};

export const getContactById = async (contactId) => {
  return await StudentsCollection.findById(contactId);
};
