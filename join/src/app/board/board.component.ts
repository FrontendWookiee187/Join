import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Contact, ContactsComponent } from '../contacts/contacts.component';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Task, TaskColumn } from '../interfaces/task.interface';
import { TaskService } from '../services/task.service';

@Component({
  selector: 'app-board',
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements OnInit {
  taskForm: FormGroup;
  showAddTaskOverlay = false;
  showTaskDetailsOverlay = false;
  selectedTask: Task | null = null;
  isEditingTask = false;
  selectedPriority: 'urgent' | 'medium' | 'low' | '' = '';
  currentColumn: TaskColumn = 'todo'; // Speichert die aktuelle Spalte
taskCollection: string = "tasks"
  contacts: Contact[] = [];
  private firestore = inject(Firestore);

  isDropdownOpen = false;
  selectedContacts: Contact[] = []; // Array für ausgewählte Kontakte

  // Arrays für die verschiedenen Spalten - jetzt typisiert
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  awaitingFeedbackTasks: Task[] = [];
  doneTasks: Task[] = [];
  tasks: Task[] = []; // Holds all tasks loaded from Firebase

  // Board columns configuration
  boardColumns = [
    {
      id: 'todo' as TaskColumn,
      title: 'To Do',
      tasks: () => this.todoTasks,
      showAddButton: true,
      emptyMessage: 'No tasks to do'
    },
    {
      id: 'inprogress' as TaskColumn,
      title: 'In Progress',
      tasks: () => this.inProgressTasks,
      showAddButton: true,
      emptyMessage: 'No tasks in progress'
    },
    {
      id: 'awaiting' as TaskColumn,
      title: 'Awaiting feedback',
      tasks: () => this.awaitingFeedbackTasks,
      showAddButton: true,
      emptyMessage: 'No tasks awaiting feedback'
    },
    {
      id: 'done' as TaskColumn,
      title: 'Done',
      tasks: () => this.doneTasks,
      showAddButton: false,
      emptyMessage: 'No tasks done'
    }
  ];

  constructor(private fb: FormBuilder, private taskService: TaskService) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      dueDate: ['', Validators.required],
      priority: [''], // Priority ist optional, wird über Buttons gesetzt
      assignedTo: [''],
      category: ['', Validators.required],
      subtasks: this.fb.array([])
    });

    // Lokale Arrays initialisieren
    this.updateLocalArrays();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleContactSelection(contact: Contact, event: Event) {
    event.stopPropagation();
    
    const index = this.selectedContacts.findIndex(c => c.id === contact.id);
    
    if (index === -1) {
      // Kontakt hinzufügen
      this.selectedContacts.push(contact);
    } else {
      // Kontakt entfernen
      this.selectedContacts.splice(index, 1);
    }
    
    console.log('Ausgewählte Kontakte:', this.selectedContacts);
  }

  isContactSelected(contact: Contact): boolean {
    return this.selectedContacts.some(c => c.id === contact.id);
  }

   selectContact(contact: Contact) {
    this.taskForm.patchValue({ assignedTo: contact.id });
    this.isDropdownOpen = false;
  }
  
  getSelectedContact(): Contact | null {
    const selectedId = this.taskForm.get('assignedTo')?.value;
    if (!selectedId) return null;
    return this.contacts.find(c => c.id === selectedId) || null;
  }

  openAddTaskOverlay(column: TaskColumn = 'todo') {
    this.showAddTaskOverlay = true;
    this.currentColumn = column;
    this.resetForm();
  }

  closeAddTaskOverlay() {
    this.showAddTaskOverlay = false;
    this.resetForm();
  }

  selectPriority(priority: 'urgent' | 'medium' | 'low') {
    this.selectedPriority = priority;
    this.taskForm.patchValue({ priority: priority });
    // Mark priority field as touched to trigger validation
    this.taskForm.get('priority')?.markAsTouched();
  }

  onCategoryChange(event?: Event) {
    // Mark category field as touched when changed
    this.taskForm.get('category')?.markAsTouched();
    
    // Force update validation status
    this.taskForm.get('category')?.updateValueAndValidity();
  }

  resetForm() {
    this.taskForm.reset();
    this.selectedPriority = '';
    this.selectedContacts = []; // Reset selected contacts
  }

  async onSubmit() {
    // Schritt 1: Alle Felder als berührt markieren
    this.markFormGroupTouched();
    
    // Schritt 2: Prüfen ob das Formular gültig ist
    if (this.taskForm.valid) {
      try {
        // Schritt 3: Task-Daten vorbereiten
        const taskData: Omit<Task, 'id' | 'createdAt'> = {
          title: this.taskForm.value.title,
          description: this.taskForm.value.description,
          dueDate: this.taskForm.value.dueDate,
          priority: this.selectedPriority,
          assignedTo: this.selectedContacts.map(contact => contact.name),
          category: this.taskForm.value.category,
          subtasks: [],
          column: this.currentColumn // ← NEU: Spalte hinzufügen
        };

        console.log('📝 Erstelle Task für Spalte:', this.currentColumn);

        // Schritt 4: Task zu Firebase hinzufügen (mit Spalten-Info)
        const firebaseId = await this.taskService.addTaskToFirebase({
          ...taskData,
          createdAt: new Date()
        }, this.currentColumn); // ← NEU: Spalte als Parameter

        console.log('✅ Firebase ID erhalten:', firebaseId);

        // Schritt 5: Task zu lokalem Service hinzufügen (mit Firebase ID)
        const newTask: Task = {
          ...taskData,
          id: firebaseId,
          createdAt: new Date()
        };

        // Schritt 6: Task zum lokalen Array hinzufügen
        this.taskService.addTaskDirectly(newTask, this.currentColumn);

        // Schritt 7: Lokale Arrays aktualisieren
        this.updateLocalArrays();

        console.log('🎉 Task erfolgreich erstellt in Spalte:', this.currentColumn);

        // Schritt 8: Overlay schließen
        this.closeAddTaskOverlay();

      } catch (error) {
        console.error('❌ Fehler beim Erstellen der Task:', error);
        alert('Fehler beim Erstellen der Task. Bitte versuchen Sie es erneut.');
      }
    } else {
      console.log('❌ Formular ist ungültig:', this.taskForm.errors);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.taskForm.controls).forEach(key => {
      const control = this.taskForm.get(key);
      control?.markAsTouched();
    });
  }

  // Lokale Arrays mit Service synchronisieren
  private updateLocalArrays() {
    this.todoTasks = this.taskService.getTasksByColumn('todo');
    this.inProgressTasks = this.taskService.getTasksByColumn('inprogress');
    this.awaitingFeedbackTasks = this.taskService.getTasksByColumn('awaiting');
    this.doneTasks = this.taskService.getTasksByColumn('done');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.taskForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Debug method to check category status
  debugCategoryStatus() {
    const categoryField = this.taskForm.get('category');
    console.log('Category field status:', {
      value: categoryField?.value,
      valid: categoryField?.valid,
      invalid: categoryField?.invalid,
      touched: categoryField?.touched,
      errors: categoryField?.errors
    });
  }

  // Helper methods for task display
  getTaskProgress(task: Task): number {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(subtask => subtask.completed).length;
    return (completed / task.subtasks.length) * 100;
  }

  getCompletedSubtasks(task: Task): number {
    if (!task.subtasks) return 0;
    return task.subtasks.filter(subtask => subtask.completed).length;
  }

  getPriorityIcon(priority: Task['priority']): string {
    switch (priority) {
      case 'urgent':
        return './assets/img/icon_priority_urgent.svg';
      case 'medium':
        return './assets/img/icon_priority_medium.svg';
      case 'low':
        return './assets/img/icon_priority_low.svg';
      default:
        return './assets/img/icon_priority_medium.svg';
    }
  }

  ngOnInit() {
  console.log('BoardComponent initialized');
  this.loadContacts()
  this.getTasksFromFirebase();
  }

  async getTasksFromFirebase() {
  try {
    const taskRef = collection(this.firestore, 'tasks');
    
    // Subscribe to the collection data
    collectionData(taskRef, { idField: 'id' }).subscribe({
      next: (tasks) => {
        this.tasks = tasks as Task[];
        console.log('✅ Tasks loaded from Firebase:', this.tasks);
        
        // NEU: Tasks in die richtigen Spalten sortieren
        this.sortTasksIntoColumns();
      },
      error: (error) => {
        console.error('❌ Error loading tasks:', error);
      }
    });
    
  } catch (error) {
    console.error("❌ Das lief wohl nicht so wie gedacht ;)", error);
  }
}

  getInitials(name: string): string {
    return ContactsComponent.getInitials(name);
  }

  getInitialsColor(name: string): string {
    return ContactsComponent.getInitialsColor(name);
  }

  private loadContacts() {
  const contactsCollection = collection(this.firestore, 'contacts');
  collectionData(contactsCollection, { idField: 'id' }).subscribe(
    (contacts) => {
      this.contacts = contacts as Contact[];
      
      // Alphabetisch sortieren
      this.contacts.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      
      console.log('Kontakte geladen:', this.contacts);
    },
    (error) => {
      console.error('Fehler beim Laden der Kontakte:', error);
    }
  );
}

getSelectedContactsText(): string {
    if (this.selectedContacts.length === 0) return '';
    
    if (this.selectedContacts.length === 1) {
      return this.selectedContacts[0].name;
    } else if (this.selectedContacts.length === 2) {
      return this.selectedContacts.map(c => c.name).join(', ');
    } else {
      return `${this.selectedContacts[0].name} +${this.selectedContacts.length - 1} more`;
    }
  }

  // New methods for displaying up to 4 avatars with "+N" indicator
  getDisplayedContacts(assignedTo: string[]): string[] {
    if (!assignedTo || assignedTo.length === 0) return [];
    return assignedTo.slice(0, 4);
  }

  getRemainingContactsCount(assignedTo: string[]): number {
    if (!assignedTo || assignedTo.length <= 4) return 0;
    return assignedTo.length - 4;
  }

  hasRemainingContacts(assignedTo: string[]): boolean {
    return assignedTo && assignedTo.length > 4;
  }

  hasMultipleContacts(assignedTo: string[]): boolean {
    return assignedTo && assignedTo.length > 1;
  }

  getContactCount(assignedTo: string[]): number {
    return assignedTo ? assignedTo.length : 0;
  }

  private sortTasksIntoColumns() {
    // Arrays zurücksetzen
    this.todoTasks = [];
    this.inProgressTasks = [];
    this.awaitingFeedbackTasks = [];
    this.doneTasks = [];

    // Tasks in die richtigen Spalten sortieren
    this.tasks.forEach(task => {
      switch (task.column) {
        case 'todo':
          this.todoTasks.push(task);
          break;
        case 'inprogress':
          this.inProgressTasks.push(task);
          break;
        case 'awaiting':
          this.awaitingFeedbackTasks.push(task);
          break;
        case 'done':
          this.doneTasks.push(task);
          break;
        default:
          // Fallback: Wenn keine Spalte definiert, in "todo" einordnen
          console.warn(`Task "${task.title}" hat keine gültige Spalte, wird in "todo" eingeordnet`);
          this.todoTasks.push(task);
      }
    });

    console.log('📊 Tasks sortiert:');
    console.log('To Do:', this.todoTasks.length);
    console.log('In Progress:', this.inProgressTasks.length);
    console.log('Awaiting:', this.awaitingFeedbackTasks.length);
    console.log('Done:', this.doneTasks.length);
  }

  // Task Details Overlay Methods
  openTaskDetails(task: Task) {
    this.selectedTask = task;
    this.showTaskDetailsOverlay = true;
    this.isEditingTask = false;
  }

  closeTaskDetailsOverlay() {
    this.showTaskDetailsOverlay = false;
    this.selectedTask = null;
    this.isEditingTask = false;
    this.showAssignedContactsDropdown = false; // Reset dropdown state
    this.resetForm();
  }

  editTask() {
    if (!this.selectedTask) return;
    
    // Close task details overlay and open edit overlay
    this.showTaskDetailsOverlay = false;
    this.isEditingTask = true;
    
    // Clear existing subtasks
    while (this.subtasksFormArray.length !== 0) {
      this.subtasksFormArray.removeAt(0);
    }
    
    // Populate form with selected task data
    this.taskForm.patchValue({
      title: this.selectedTask.title,
      description: this.selectedTask.description,
      dueDate: this.selectedTask.dueDate,
      priority: this.selectedTask.priority,
      category: this.selectedTask.category
    });
    
    this.selectedPriority = this.selectedTask.priority || '';
    
    // Set selected contacts
    this.selectedContacts = this.selectedTask.assignedTo ? 
      this.contacts.filter(contact => this.selectedTask!.assignedTo!.includes(contact.name)) : [];
      
    // Load subtasks
    if (this.selectedTask.subtasks) {
      this.selectedTask.subtasks.forEach(subtask => {
        const subtaskGroup = this.fb.group({
          title: [subtask.title, Validators.required],
          completed: [subtask.completed]
        });
        this.subtasksFormArray.push(subtaskGroup);
      });
    }
  }

  cancelEditTask() {
    this.isEditingTask = false;
    this.showTaskDetailsOverlay = true;
    this.resetForm();
  }

  async saveTaskChanges() {
    if (!this.selectedTask || !this.taskForm.valid) return;

    try {
      const updatedTask: Task = {
        ...this.selectedTask,
        title: this.taskForm.value.title,
        description: this.taskForm.value.description,
        dueDate: this.taskForm.value.dueDate,
        priority: this.selectedPriority as any,
        category: this.taskForm.value.category,
        assignedTo: this.selectedContacts.map(contact => contact.name),
        subtasks: this.taskForm.value.subtasks || []
      };

      await this.taskService.updateTaskInFirebase(updatedTask);
      
      // Update local tasks array
      const taskIndex = this.tasks.findIndex(t => t.id === updatedTask.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = updatedTask;
        this.sortTasksIntoColumns();
      }

      this.selectedTask = updatedTask;
      this.isEditingTask = false;
      this.showTaskDetailsOverlay = true; // Return to task details overlay
      console.log('✅ Task updated successfully');
    } catch (error) {
      console.error('❌ Error updating task:', error);
    }
  }

  async deleteTask() {
    if (!this.selectedTask || !this.selectedTask.id) return;

    const confirmDelete = confirm(`Are you sure you want to delete the task "${this.selectedTask.title}"?`);
    if (!confirmDelete) return;

    try {
      await this.taskService.deleteTaskFromFirebase(this.selectedTask.id);
      
      // Remove from local arrays
      this.tasks = this.tasks.filter(t => t.id !== this.selectedTask!.id);
      this.sortTasksIntoColumns();

      this.closeTaskDetailsOverlay();
      console.log('✅ Task deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting task:', error);
    }
  }

  getSubtaskProgress(): number {
    if (!this.selectedTask?.subtasks || this.selectedTask.subtasks.length === 0) {
      return 0;
    }
    const completed = this.selectedTask.subtasks.filter(subtask => subtask.completed).length;
    return (completed / this.selectedTask.subtasks.length) * 100;
  }

  getCompletedSubtasksCount(): number {
    if (!this.selectedTask?.subtasks) return 0;
    return this.selectedTask.subtasks.filter(subtask => subtask.completed).length;
  }

  toggleSubtask(subtaskIndex: number) {
    if (!this.selectedTask?.subtasks) return;
    
    this.selectedTask.subtasks[subtaskIndex].completed = !this.selectedTask.subtasks[subtaskIndex].completed;
    
    // Auto-save subtask changes
    this.saveTaskChanges();
  }

  showAssignedContactsDropdown = false; // Controls dropdown visibility for assigned contacts in task details

  // Methods for assigned contacts dropdown in task details
  getDisplayedAssignedContacts(): string[] {
    if (!this.selectedTask?.assignedTo) return [];
    return this.selectedTask.assignedTo.slice(0, 2);
  }

  hasMoreAssignedContacts(): boolean {
    return this.selectedTask?.assignedTo ? this.selectedTask.assignedTo.length > 2 : false;
  }

  getRemainingAssignedContactsCount(): number {
    if (!this.selectedTask?.assignedTo || this.selectedTask.assignedTo.length <= 2) return 0;
    return this.selectedTask.assignedTo.length - 2;
  }

  getRemainingAssignedContacts(): string[] {
    if (!this.selectedTask?.assignedTo) return [];
    return this.selectedTask.assignedTo.slice(2);
  }

  toggleAssignedContactsDropdown(): void {
    this.showAssignedContactsDropdown = !this.showAssignedContactsDropdown;
  }

  get subtasksFormArray(): FormArray {
    return this.taskForm.get('subtasks') as FormArray;
  }

  addSubtask() {
    const subtaskGroup = this.fb.group({
      title: ['', Validators.required],
      completed: [false]
    });
    this.subtasksFormArray.push(subtaskGroup);
  }

  removeSubtask(index: number) {
    this.subtasksFormArray.removeAt(index);
  }
}
