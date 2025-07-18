﻿import { Injectable } from '@angular/core';
import { Contact, ContactDataService } from './contact-data.service';
import { ContactOrganizationService } from './contact-organization.service';
import { AuthService } from '../../shared/services/auth.service';
/**
 * Service for managing contact CRUD operations and business logic.
 * Handles contact creation, updates, deletion, and data management.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 1.0.0
 */
@Injectable({ providedIn: 'root' })
export class ContactsCrudService {
  constructor(
    private dataService: ContactDataService,
    private organizationService: ContactOrganizationService,
    private authService: AuthService
  ) {}
  /**
   * Creates a new contact.
   * 
   * @param contactData - Contact data to create
   * @param existingContacts - Current contacts to check for duplicates
   * @returns Promise with created contact
   */
  async createContact(contactData: Partial<Contact>, existingContacts: Contact[] = []): Promise<Contact> {
    // Validate required fields
    if (!contactData.name || !contactData.email) {
      throw new Error('Name and email are required for contact creation');
    }
    // Check for duplicate email
    const existingContact = this.findContactByEmail(contactData.email, existingContacts);
    if (existingContact) {
      throw new Error('A contact with this email already exists');
    }
    try {
      const newContact = await this.dataService.addContactToFirestore({
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone || 'N/A'
      });
      return newContact;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  }
  /**
   * Updates an existing contact.
   * 
   * @param contactId - ID of contact to update
   * @param contactData - Updated contact data
   * @returns Promise with updated contact
   */
  async updateContact(contactId: string, contactData: Partial<Contact>): Promise<Contact> {
    if (!contactId) {
      throw new Error('Contact ID is required for update');
    }
    try {
      // Handle current user updates differently
      const contact = await this.getContactById(contactId);
      if (contact?.isCurrentUser) {
        await this.updateCurrentUserProfile(contactData);
        return { ...contact, ...contactData };
      } else {
        await this.dataService.updateContactInFirestore(contactId, contactData);
        return { ...contact, ...contactData } as Contact;
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      throw new Error('Failed to update contact');
    }
  }
  /**
   * Deletes a contact.
   * 
   * @param contactId - ID of contact to delete
   * @returns Promise indicating success
   */
  async deleteContact(contactId: string): Promise<void> {
    if (!contactId) {
      throw new Error('Contact ID is required for deletion');
    }
    // Prevent deletion of current user
    const contact = await this.getContactById(contactId);
    if (contact?.isCurrentUser) {
      throw new Error('Cannot delete the current user');
    }
    try {
      await this.dataService.deleteContactFromFirestore(contactId);
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw new Error('Failed to delete contact');
    }
  }
  /**
   * Gets a contact by ID.
   * 
   * @param contactId - Contact ID
   * @returns Promise with contact or null
   */
  async getContactById(contactId: string): Promise<Contact | null> {
    try {
      // Handle current user special case
      if (contactId === 'current-user') {
        return this.getCurrentUserAsContact();
      }
      // For regular contacts, we need to get from the current contacts list
      // Since we don't have a direct method, we'll return null and let the component handle it
      return null;
    } catch (error) {
      console.error('Error getting contact by ID:', error);
      return null;
    }
  }
  /**
   * Finds a contact by email address.
   * 
   * @param email - Email to search for
   * @param contacts - Current contacts array to search in
   * @returns Contact or null
   */
  findContactByEmail(email: string, contacts: Contact[]): Contact | null {
    try {
      return contacts.find((contact: Contact) => 
        contact.email.toLowerCase() === email.toLowerCase()
      ) || null;
    } catch (error) {
      console.error('Error finding contact by email:', error);
      return null;
    }
  }
  /**
   * Gets all contacts with current user included.
   * 
   * @param existingContacts - Current contacts from Firestore
   * @returns Contacts array with current user
   */
  getAllContactsWithCurrentUser(existingContacts: Contact[]): Contact[] {
    try {
      const currentUserContact = this.getCurrentUserAsContact();
      if (currentUserContact) {
        return [currentUserContact, ...existingContacts];
      }
      return existingContacts;
    } catch (error) {
      console.error('Error loading contacts:', error);
      throw new Error('Failed to load contacts');
    }
  }
  /**
   * Adds a contact to the local array and maintains sort order.
   * 
   * @param contacts - Current contacts array
   * @param newContact - Contact to add
   * @returns Updated contacts array
   */
  addContactToArray(contacts: Contact[], newContact: Contact): Contact[] {
    return this.organizationService.addContactToArray(contacts, newContact);
  }
  /**
   * Updates a contact in the local array.
   * 
   * @param contacts - Current contacts array
   * @param updatedContact - Updated contact
   * @returns Updated contacts array
   */
  updateContactInArray(contacts: Contact[], updatedContact: Contact): Contact[] {
    return this.organizationService.updateContactInArray(contacts, updatedContact);
  }
  /**
   * Removes a contact from the local array.
   * 
   * @param contacts - Current contacts array
   * @param contactId - ID of contact to remove
   * @returns Updated contacts array
   */
  removeContactFromArray(contacts: Contact[], contactId: string): Contact[] {
    return this.organizationService.removeContactFromArray(contacts, contactId);
  }
  /**
   * Updates the current user's profile in Firebase Auth.
   * 
   * @param contactData - Contact data to update
   */
  private async updateCurrentUserProfile(contactData: Partial<Contact>): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('No current user found');
    }
    // Update Firebase Auth profile if name changed
    if (contactData.name && contactData.name !== currentUser.name) {
      await this.authService.updateUserProfile(contactData.name);
    }
    // Note: Phone is not stored in Firebase Auth, only in the temporary contact object
    // This is handled in the component level for display purposes
  }
  /**
   * Gets the current user as a contact object.
   * 
   * @returns Current user contact or null
   */
  getCurrentUserAsContact(): Contact | null {
    const user = this.authService.currentUser;
    if (!user) {
      return null;
    }
    return {
      id: 'current-user',
      name: user.name || user.email || 'Current User',
      email: user.email || '',
      phone: '', // Phone will be empty for current user initially
      isCurrentUser: true
    };
  }
  /**
   * Validates contact data before operations.
   * 
   * @param contactData - Contact data to validate
   * @returns Validation result
   */
  validateContactData(contactData: Partial<Contact>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    // Required field validation
    if (!contactData.name?.trim()) {
      errors.push('Name is required');
    }
    if (!contactData.email?.trim()) {
      errors.push('Email is required');
    }
    // Email format validation
    if (contactData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactData.email)) {
        errors.push('Invalid email format');
      }
    }
    // Name length validation
    if (contactData.name && contactData.name.length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
    // Phone validation (if provided)
    if (contactData.phone && contactData.phone !== 'N/A') {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = contactData.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Invalid phone number format');
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  /**
   * Searches contacts by name or email.
   * 
   * @param contacts - Contacts array to search
   * @param query - Search query
   * @returns Filtered contacts array
   */
  searchContacts(contacts: Contact[], query: string): Contact[] {
    if (!query?.trim()) {
      return contacts;
    }
    const searchTerm = query.toLowerCase().trim();
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm)
    );
  }
  /**
   * Gets contact statistics.
   * 
   * @param contacts - Contacts array
   * @returns Contact statistics
   */
  getContactStats(contacts: Contact[]): {
    total: number;
    withPhone: number;
    withoutPhone: number;
    groups: number;
  } {
    const withPhone = contacts.filter(c => c.phone && c.phone !== 'N/A').length;
    const groups = Object.keys(this.organizationService.groupContactsByLetter(contacts)).length;
    return {
      total: contacts.length,
      withPhone,
      withoutPhone: contacts.length - withPhone,
      groups
    };
  }
  /**
   * Bulk creates contacts from an array.
   * 
   * @param contactsData - Array of contact data
   * @returns Promise with results
   */
  async bulkCreateContacts(contactsData: Partial<Contact>[]): Promise<{
    successful: Contact[];
    failed: { data: Partial<Contact>; error: string }[];
  }> {
    const successful: Contact[] = [];
    const failed: { data: Partial<Contact>; error: string }[] = [];
    for (const contactData of contactsData) {
      try {
        const newContact = await this.createContact(contactData);
        successful.push(newContact);
      } catch (error) {
        failed.push({
          data: contactData,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    return { successful, failed };
  }
  /**
   * Exports contacts to a specific format.
   * 
   * @param contacts - Contacts to export
   * @param format - Export format
   * @returns Formatted contact data
   */
  exportContacts(contacts: Contact[], format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(contacts, null, 2);
    }
    if (format === 'csv') {
      const headers = 'Name,Email,Phone\n';
      const rows = contacts.map(contact =>
        `"${contact.name}","${contact.email}","${contact.phone}"`
      ).join('\n');
      return headers + rows;
    }
    throw new Error('Unsupported export format');
  }
  /**
   * Cleanup method for service destruction.
   */
  cleanup(): void {
    // No cleanup needed for this service
  }
}
