import { ContactsCollection } from '../db/models/contacts.js';

export const getContacts = async () => {
  return await ContactsCollection.find();
};

export const getContactById = async (contactId) => {
  return await ContactsCollection.findById(contactId);
};

export const createContact = async (body) => {
  return await ContactsCollection.create(body);
};

export const deleteContact = async (contactId) => {
  return await ContactsCollection.findOneAndDelete({
    _id: contactId,
  });
};

export const updateContact = async (contactId, body) => {
  const result = await ContactsCollection.findOneAndUpdate(
    {
      _id: contactId,
    },
    body,
    { new: true, includeResultMetadata: true },
  );
  return result.value;
};
