﻿import { Injectable } from '@angular/core';
import { Task, TaskColumn } from '../../interfaces/task.interface';
import { TaskService } from '../../shared/services/task.service';
import { BoardThumbnailService } from './board-thumbnail.service';
import { BoardDragStateService } from './board-drag-state.service';
import { BoardAutoScrollService } from './board-auto-scroll.service';
import { BoardTouchHandlerService } from './board-touch-handler.service';
/**
 * Main service for handling drag & drop functionality in the board component.
 * Orchestrates task dragging, column detection, and visual feedback for both desktop and mobile.
 * 
 * @author Daniel Grabowski, Gary Angelone, Joshua Brunke, Morteza Chinahkash
 * @version 2.0.0 - Refactored into multiple specialized services
 */
@Injectable({ providedIn: 'root' })

export class BoardDragDropService {
  /** Constructor initializes drag drop service with dependencies */
  constructor(
    private taskService: TaskService,
    private boardThumbnailService: BoardThumbnailService,
    private dragState: BoardDragStateService,
    private autoScroll: BoardAutoScrollService,
    private touchHandler: BoardTouchHandlerService
  ) {}
  
  /** Gets currently dragged task */
  get draggedTask(): Task | null { return this.dragState.draggedTask; }

  /** Gets drag operation state */
  get isDraggingTask(): boolean { return this.dragState.isDraggingTask; }

  /** Gets column being dragged over */
  get dragOverColumn(): TaskColumn | null { return this.dragState.dragOverColumn; }

  /** Gets drag placeholder visibility */
  get dragPlaceholderVisible(): boolean { return this.dragState.dragPlaceholderVisible; }

  /** Gets drag placeholder height */
  get dragPlaceholderHeight(): number { return this.dragState.dragPlaceholderHeight; }

  /**
   * Handles mouse down events on tasks for desktop drag & drop functionality.
   * Initiates task dragging with left mouse button click and sets up mouse event listeners.
   * Includes delay and distance threshold to prevent interference with click events.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a click
   */
  onTaskMouseDown(event: MouseEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      if (event.button !== 0) { resolve(false); return; }
      const dragContext = this.initializeMouseDragContext(event, task);
      const handleMouseMove = this.createMouseMoveHandler(event, task, dragContext);
      const handleMouseUp = this.createMouseUpHandler(onTaskUpdate, resolve, handleMouseMove, dragContext);
      this.attachMouseEventListeners(handleMouseMove, handleMouseUp);
    });
  }

  /**
   * Initializes mouse drag context and sets up initial state.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @returns Object containing drag context variables
   * @private
   */
  private initializeMouseDragContext(event: MouseEvent, task: Task): { hasMoved: boolean; dragStarted: boolean } {
    this.dragState.setMousePressed(event.clientX, event.clientY);
    const dragContext = { hasMoved: false, dragStarted: false };
    this.setupDragDelayTimeout(event, task, dragContext);
    return dragContext;
  }

  /**
   * Sets up the drag delay timeout to prevent accidental drags.
   * 
   * @param event - The mouse event from the task element
   * @param task - The task object to be dragged
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private setupDragDelayTimeout(event: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    this.dragState.dragDelayTimeout = setTimeout(() => {
      if (this.dragState.isMousePressed && !dragContext.hasMoved) {
        this.startTaskDrag(event.clientX, event.clientY, task, event.target as HTMLElement);
        dragContext.dragStarted = true;
      }
    }, this.dragState.dragDelay);
  }

  /**
   * Creates the mouse move event handler for drag operations.
   * 
   * @param event - The original mouse event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @returns Mouse move event handler function
   * @private
   */
  private createMouseMoveHandler(event: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): (e: MouseEvent) => void {
    return (e: MouseEvent) => {
      if (!this.dragState.isMousePressed) return;
      this.handleMouseMovement(e, event, task, dragContext);
      this.handleActiveDrag(e);
    };
  }

  /**
   * Handles mouse movement and threshold detection.
   * 
   * @param e - The current mouse event
   * @param originalEvent - The original mouse down event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private handleMouseMovement(e: MouseEvent, originalEvent: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    if (this.dragState.exceedsDragThreshold(e.clientX, e.clientY)) {
      dragContext.hasMoved = true;
      if (!dragContext.dragStarted && !this.dragState.isDraggingTask) {
        this.startDragFromMovement(e, originalEvent, task, dragContext);
      }
    }
  }

  /**
   * Starts drag operation when movement threshold is exceeded.
   * 
   * @param e - The current mouse event
   * @param originalEvent - The original mouse down event
   * @param task - The task object being dragged
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private startDragFromMovement(e: MouseEvent, originalEvent: MouseEvent, task: Task, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    this.dragState.clearTimeouts();
    this.startTaskDrag(e.clientX, e.clientY, task, originalEvent.target as HTMLElement);
    dragContext.dragStarted = true;
  }

  /**
   * Handles active drag operations.
   * 
   * @param e - The current mouse event
   * @private
   */
  private handleActiveDrag(e: MouseEvent): void {
    if (this.dragState.isDraggingTask) {
      this.autoScroll.emergencyAutoScroll(e);
      this.updateTaskDrag(e.clientX, e.clientY);
    }
  }

  /**
   * Creates the mouse up event handler for ending drag operations.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param handleMouseMove - The mouse move handler to remove
   * @param dragContext - The drag context containing movement state
   * @returns Mouse up event handler function
   * @private
   */
  private createMouseUpHandler(onTaskUpdate: () => void, resolve: (value: boolean) => void, handleMouseMove: (e: MouseEvent) => void, dragContext: { hasMoved: boolean; dragStarted: boolean }): () => void {
    return () => {
      this.removeMouseEventListeners(handleMouseMove, arguments.callee as EventListener);
      this.finalizeMouseDrag(onTaskUpdate, resolve, dragContext);
    };
  }

  /**
   * Finalizes mouse drag operation and resolves promise.
   * 
   * @param onTaskUpdate - Callback to update local task arrays
   * @param resolve - Promise resolve function
   * @param dragContext - The drag context containing movement state
   * @private
   */
  private finalizeMouseDrag(onTaskUpdate: () => void, resolve: (value: boolean) => void, dragContext: { hasMoved: boolean; dragStarted: boolean }): void {
    this.dragState.isMousePressed = false;
    this.dragState.clearTimeouts();
    if (this.dragState.isDraggingTask) {
      this.finishTaskDrag(onTaskUpdate);
    }
    resolve(dragContext.dragStarted);
  }

  /**
   * Attaches mouse event listeners to the document.
   * 
   * @param handleMouseMove - Mouse move handler function
   * @param handleMouseUp - Mouse up handler function
   * @private
   */
  private attachMouseEventListeners(handleMouseMove: (e: MouseEvent) => void, handleMouseUp: () => void): void {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  /**
   * Removes mouse event listeners from the document.
   * 
   * @param handleMouseMove - Mouse move handler function
   * @param handleMouseUp - Mouse up handler function
   * @private
   */
  private removeMouseEventListeners(handleMouseMove: (e: MouseEvent) => void, handleMouseUp: EventListener): void {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  /**
   * Handles touch start events on tasks for mobile drag & drop functionality.
   * Delegates to TouchHandlerService for mobile-specific behavior.
   * 
   * @param event - The touch event from the task element
   * @param task - The task object to be dragged
   * @param onTaskUpdate - Callback to update local task arrays
   * @returns Promise<boolean> - Returns true if drag was started, false if it was a tap
   */
  onTaskTouchStart(event: TouchEvent, task: Task, onTaskUpdate: () => void): Promise<boolean> {
    return this.touchHandler.onTaskTouchStart(event, task, onTaskUpdate);
  }

  /**
   * Starts task drag operation for desktop.
   * 
   * @param clientX - Mouse X position
   * @param clientY - Mouse Y position
   * @param task - Task being dragged
   * @param targetElement - Target element
   */
  private startTaskDrag(clientX: number, clientY: number, task: Task, targetElement: HTMLElement): void {
    this.dragState.startDrag(task, clientX, clientY);
    this.createDragElement(task, targetElement, clientX, clientY);
    const taskElement = targetElement.closest('.task-card') as HTMLElement;
    if (taskElement) {
      taskElement.style.opacity = '0.5';
    }
  }

  /**
   * Updates task drag position.
   * 
   * @param clientX - Current X position
   * @param clientY - Current Y position
   */
  private updateTaskDrag(clientX: number, clientY: number): void {
    this.dragState.updateDragPosition(clientX, clientY);
    this.autoScroll.handleAutoScroll(clientX, clientY);
    const column = this.getColumnAtPosition(clientX, clientY);
    this.dragState.setDragOverColumn(column);
  }

  /**
   * Finishes task drag operation.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private finishTaskDrag(onTaskUpdate: () => void): void {
    if (this.dragState.dragElement) {
      this.dragState.dragElement.remove();
    }
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      (card as HTMLElement).style.opacity = '';
    });
    if (this.dragState.dragOverColumn && this.dragState.draggedTask) {
      this.handleTaskDrop(onTaskUpdate);
    }
    this.dragState.resetDragState();
    this.autoScroll.stopAutoScroll();
  }

  /**
   * Creates visual drag element.
   * 
   * @param task - Task being dragged
   * @param originalElement - Original task element
   * @param clientX - X position
   * @param clientY - Y position
   */
  private createDragElement(task: Task, originalElement: HTMLElement, clientX: number, clientY: number): void {
    const taskElement = originalElement.closest('.task-card') as HTMLElement;
    if (!taskElement) return;
    const dragElement = taskElement.cloneNode(true) as HTMLElement;
    dragElement.style.position = 'fixed';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.zIndex = '10000';
    dragElement.style.transform = 'rotate(2deg)';
    dragElement.style.boxShadow = '0 8px 25px rgba(0,0,0,0.25)';
    dragElement.style.opacity = '0.95';
    dragElement.style.width = `${taskElement.offsetWidth}px`;
    document.body.appendChild(dragElement);
    this.dragState.setDragElement(dragElement, clientX, clientY);
    this.dragState.updateDragPosition(clientX, clientY);
  }

  /**
   * Determines which column is at the given position.
   * 
   * @param clientX - X coordinate
   * @param clientY - Y coordinate
   * @returns Column at position or null
   */
  private getColumnAtPosition(clientX: number, clientY: number): TaskColumn | null {
    const elements = document.elementsFromPoint(clientX, clientY);
    for (const element of elements) {
      if (element.classList.contains('column')) {
        const columnId = element.getAttribute('data-column');
        switch (columnId) {
          case 'todo': return 'todo';
          case 'inprogress': return 'inprogress';
          case 'awaiting': return 'awaiting';
          case 'done': return 'done';
        }
      }
    }
    return null;
  }

  /**
   * Handles task drop logic.
   * 
   * @param onTaskUpdate - Callback for task updates
   */
  private handleTaskDrop(onTaskUpdate: () => void): void {
    if (!this.dragState.draggedTask || !this.dragState.dragOverColumn) return;
    const oldColumn = this.dragState.draggedTask.column;
    const newColumn = this.dragState.dragOverColumn;
    if (oldColumn !== newColumn) {
      this.dragState.draggedTask.column = newColumn;
      const success = this.taskService.updateTask(this.dragState.draggedTask.id || '', {
        column: newColumn
      });
      if (success) {
        onTaskUpdate();
      } else {
        this.dragState.draggedTask.column = oldColumn;
        onTaskUpdate();
      }
    }
  }

  /**
   * Handles drag over events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDragOver(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    this.dragState.setDragOverColumn(column);
  }

  /**
   * Handles drag leave events on columns.
   * 
   * @param event - Drag event
   */
  onColumnDragLeave(event: DragEvent): void {
    if (!event.relatedTarget || !event.currentTarget) return;
    const currentTarget = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      this.dragState.setDragOverColumn(null);
    }
  }

  /**
   * Handles drop events on columns.
   * 
   * @param event - Drag event
   * @param column - Target column
   */
  onColumnDrop(event: DragEvent, column: TaskColumn): void {
    event.preventDefault();
    if (this.dragState.draggedTask) {
      this.dragState.setDragOverColumn(column);
    }
  }

  /**
   * Cleanup method to stop all drag operations and clean up state.
   */
  cleanup(): void {
    this.dragState.resetDragState();
    this.autoScroll.cleanup();
    this.touchHandler.cleanup();
  }
}
