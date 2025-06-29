import { CommonModule } from '@angular/common';
import { Component, inject, Inject, OnInit } from '@angular/core';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators,} from '@angular/forms';
import {Firestore, collectionData, collection, addDoc, doc,} from '@angular/fire/firestore';
import { trigger, transition, style, animate } from '@angular/animations';
import { deleteDoc, setDoc, updateDoc } from 'firebase/firestore';
export interface Contact {
  /** Unique identifier for the contact */
  id?: string;
  /** Contact's full name */
  name: string;
  /** Contact's email address */
  email: string;
  /** Contact's phone number (optional) */
  phone?: string;
}

import { InlineSvgDirective } from '../inline-svg.directive';

/**
 * Component for managing contacts with full CRUD operations
 * Supports adding, editing, deleting, and viewing contacts
 * Includes responsive design for mobile and desktop views
 */
@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, InlineSvgDirective],
  templateUrl: './contacts.component.reduced.html',
  styleUrls: ['./contacts.component.scss'],
  animations: [
    trigger('slideInRight', [
      transition('* => suppress', []), // Keine Enter-Animation wenn suppress
      transition('suppress => void', []), // Keine Leave-Animation wenn suppress
      transition('* => *', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '350ms cubic-bezier(.35,0,.25,1)',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(.35,0,.25,1)',
          style({ transform: 'translateX(100%)', opacity: 0 })
        ),
      ]),
    ]),
  ],
})
export class ContactsComponent implements OnInit {
  /** Controls visibility of the success message overlay */
  contactSuccessMessageOverlay: boolean = false;
  /** Text content for the success message */
  contactSuccessMessageText: string = 'Contact successfully created!';
  /** Array of all contacts */
  contacts: Contact[] = [];
  /** Contacts grouped by first letter of name */
  groupedContacts: { [key: string]: Contact[] } = {};
  /** Currently selected contact for viewing/editing */
  selectedContact: Contact | null = null;
  /** Flag to suppress animations during operations */
  suppressAnimation = false;
  /** Firestore database instance */
  private firestore = inject(Firestore);
  /** Controls visibility of the add contact overlay */
  showAddContactOverlay: boolean = false;
  /** Controls visibility of the edit contact overlay */
  showEditContactOverlay: boolean = false;
  /** Reactive form for adding/editing contacts */
  addContactForm: FormGroup;

  /** Flag indicating if the current view is mobile */
  isMobileView = false;
  /** Controls mobile single contact view visibility */
  showMobileSingleContact = false;
  constructor(private fb: FormBuilder) {
    this.addContactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
  }

  /**
   * Opens the overlay for adding a new contact and resets the form
   */
  openAddContactOverlay() {
    this.showAddContactOverlay = true;
    this.addContactForm.reset();
  }
  /**
   * Closes the overlay for adding a new contact
   */
  closeAddContactOverlay() {
    this.showAddContactOverlay = false;
  }
  /**
   * Handles the submission of the add contact form
   * Validates the form and adds the contact to Firestore if valid
   */
  onSubmitAddContact() {
    this.ensurePhoneValue();
    if (this.addContactForm.valid) {
      this.addContactToFirestore(this.addContactForm.value)
        .then((newContact) => {
          this.handleContactAdded(newContact);
        })
        .catch((error) => {
          this.handleAddContactError(error);
        });
    } else {
      this.addContactForm.markAllAsTouched();
    }
  }

  handleFabClick(): void {
    if (this.showMobileSingleContact) {
      this.openMoreMenu(); 
    } else {
      this.openAddContactOverlay(); 
    }
  }

/** Controls visibility of the mobile “more” menu */
  showMobileMoreMenu = false;

  /** Called when FAB is tapped in “single contact” mode */
  openMoreMenu(): void {
    this.showMobileMoreMenu = true;
  }

  /** Close the mobile more‐menu */
  closeMoreMenu(): void {
    this.showMobileMoreMenu = false;
  }

  /**
   * Adds a new contact to Firestore.
   * @param values The form values for the new contact.
   * @returns A promise resolving to the created Contact.
   */
  private async addContactToFirestore(values: {
    name: string;
    email: string;
    phone?: string;
  }): Promise<Contact> {
    const docRef = await addDoc(collection(this.firestore, 'contacts'), {
      name: values.name,
      email: values.email,
      phone: values.phone,
    });
    return {
      id: docRef.id,
      name: values.name,
      email: values.email,
      phone: values.phone,
    };
  }

  /**
   * Handles the logic after a contact has been successfully added.
   * @param newContact The newly added contact.
   */
  private handleContactAdded(newContact: Contact) {
    this.contacts.push(newContact);
    this.groupContacts();
    this.closeAddContactOverlay();
    this.showSuccessMessage('Contact successfully created!');
    this.selectContact(newContact);
  }

  /**
   * Handles errors that occur when adding a contact.
   * @param error The error object.
   */
  private handleAddContactError(error: string): void {
    console.error('Error adding contact: ', error);
  }

  /**
   * Handles the submission of the update contact form.
   * Updates the contact in Firestore if the form is valid.
   */
  onSubmitUpdateContact() {
    this.ensurePhoneValue();
    if (
      this.addContactForm.valid &&
      this.selectedContact &&
      this.selectedContact.id
    ) {
      this.updateContactInFirestore(
        this.selectedContact.id,
        this.addContactForm.value
      )
        .then(() => {
          this.updateSelectedContact(this.addContactForm.value);
          this.closeEditContactOverlay();
          this.showSuccessMessage('Contact successfully updated!');
        })
        .catch((error) => {
          console.error('Error updating contact: ', error);
        });
    } else {
      this.addContactForm.markAllAsTouched();
      if (!this.selectedContact?.id) {
        console.error('No contact id for update!');
      }
    }
  }

  /**
   * Ensures the phone field has a value; sets to "N/A" if empty.
   */
  private ensurePhoneValue() {
    const phoneValue = this.addContactForm.get('phone')?.value;
    if (!phoneValue || phoneValue.trim() === '') {
      this.addContactForm.get('phone')?.setValue('N/A');
      this.addContactForm.get('phone')?.updateValueAndValidity();
    }
  }

  /**
   * Updates a contact in Firestore.
   * @param contactId The ID of the contact to update.
   * @param values The updated form values.
   * @returns A promise for the update operation.
   */
  private updateContactInFirestore(
    contactId: string,
    values: Contact
  ): Promise<void> {
    return updateDoc(doc(this.firestore, 'contacts', contactId), {
      name: values.name,
      email: values.email,
      phone: values.phone,
    });
  }

  /**
   * Updates the selected contact in the local contacts array.
   * @param values The updated values.
   */
  private updateSelectedContact(values: string | Contact) {
    if (this.selectedContact) {
      Object.assign(this.selectedContact, values);
    }
  }

  /**
   * Closes the overlay for editing a contact.
   */
  closeEditContactOverlay() {
    this.showEditContactOverlay = false;
  }

  /**
   * Opens the overlay for editing a contact and populates the form.
   * @param contact The contact to edit.
   */
  openEditContactOverlay(contact: Contact) {
    this.showEditContactOverlay = true;
    this.selectedContact = contact;
    this.addContactForm.patchValue({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    });
  }

  /**
   * Deletes the currently selected contact.
   */
  deleteContact() {
    this.suppressAnimation = true;
    if (this.selectedContact && this.selectedContact.id) {
      const contactId = this.selectedContact.id;
      this.performDeleteContact(contactId);
    }
  }

  /**
   * Performs the deletion of a contact from Firestore and updates the local list.
   * @param contactId The ID of the contact to delete.
   */
  private performDeleteContact(contactId: string) {
    deleteDoc(doc(this.firestore, 'contacts', contactId))
      .then(() => {
        this.removeContactFromList(contactId);
        this.groupContacts();
        this.showSuccessMessage('Contact successfully deleted!');
        this.clearSelectedContactAsync();
      })
      .catch((error) => {
        console.error('Error deleting contact: ', error);
        this.suppressAnimation = false;
      });
  }

  /**
   * Removes a contact from the local contacts array.
   * @param contactId The ID of the contact to remove.
   */
  private removeContactFromList(contactId: string) {
    this.contacts = this.contacts.filter((c) => c.id !== contactId);
  }

  /**
   * Clears the selected contact asynchronously and resets animation suppression.
   */
  private clearSelectedContactAsync() {
    setTimeout(() => {
      this.selectedContact = null;
      this.suppressAnimation = false;
    }, 0);
  }

  /**
   * Angular lifecycle hook that initializes the component.
   * Loads contacts from Firestore and groups them.
   */
  ngOnInit() {
    this.updateMobileViewStatus();
    window.addEventListener('resize', this.updateMobileViewStatus.bind(this));

    const contactsCollection = collection(this.firestore, 'contacts');
    collectionData(contactsCollection, { idField: 'id' }).subscribe(
      (contacts) => {
        this.contacts = contacts as Contact[];
        this.groupContacts();
      }
    );
  }

  /**
   * Updates the mobile view status based on window width
   * Resets mobile single contact view when switching back to desktop
   */
  updateMobileViewStatus() {
    this.isMobileView = window.innerWidth <= 1000;
    if (!this.isMobileView) {
      this.showMobileSingleContact = false; // reset when going back to desktop
    }
  }

  /**
   * Groups contacts by the first letter of their name.
   */
  groupContacts() {
    this.groupedContacts = {};
    for (const contact of this.contacts) {
      if (!contact.name) continue;
      const firstLetter = contact.name.trim()[0].toUpperCase();
      if (!this.groupedContacts[firstLetter]) {
        this.groupedContacts[firstLetter] = [];
      }
      this.groupedContacts[firstLetter].push(contact);
    }
    
    // Sortiere die Kontakte innerhalb jeder Gruppe alphabetisch
    for (const letter in this.groupedContacts) {
      this.groupedContacts[letter].sort((a, b) => {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      });
    }
  }

  /**
   * Returns the initials for a given name.
   * @param name The name to extract initials from.
   * @returns The initials as a string.
   */
  static getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /**
   * Returns a color string based on the first letter of the name.
   * @param name The name to determine the color for.
   * @returns A hex color string.
   */
  static getInitialsColor(name: string): string {
    if (!name) return '#888';
    const colors = [
      '#FFB900', '#D83B01','#B50E0E', '#E81123',
      '#B4009E', '#5C2D91','#0078D7', '#00B4FF',
      '#008272', '#107C10','#7FBA00', '#F7630C',
      '#CA5010', '#EF6950','#E74856', '#0099BC',
      '#7A7574', '#767676','#FF8C00', '#E3008C',
      '#68217A', '#00188F','#00BCF2', '#00B294',
      '#BAD80A', '#FFF100',
    ];
    // Erster Buchstabe als Index (A=0, B=1, ...)
    const letter = name.trim()[0].toUpperCase();
    const index = letter.charCodeAt(0) - 65;
    return colors[index % colors.length];
  }

  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  /**
   * Selects a contact as the currently active contact.
   * @param contact The contact to select.
   */
  selectContact(contact: Contact) {
    this.selectedContact = contact;
    if (this.isMobileView) {
      this.showMobileSingleContact = true;
    }
  }

  /**
   * Navigates back to the contact list view on mobile devices
   * Clears the selected contact and hides the single contact view
   */
  backToList() {
    this.showMobileSingleContact = false;
    this.selectedContact = null;
    this.closeMoreMenu();
  }

  /**
   * Shows a success message overlay with the given message for 3 seconds.
   * @param message The message to display.
   */
  showSuccessMessage(message: string) {
    this.contactSuccessMessageText = message;
    this.contactSuccessMessageOverlay = true;
    setTimeout(() => {
      this.contactSuccessMessageOverlay = false;
    }, 3000); // Nachricht nach 3 Sekunden ausblenden
  }
}
