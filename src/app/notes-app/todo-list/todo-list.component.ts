import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskStatus } from '../Constants/todo-status';
import { TodoService } from '../todo.service';
import { Todo } from '../interfaces/todo';
import { NotesService } from '../../services/notes.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
})
export class TodoListComponent implements OnInit {
  @Input() taskList: Todo[] = [];
  @Input() selectedItem: string = TaskStatus.All;

  editingId: number | null = null;
  editTitle: string = '';
  editContent: string = '';

  toastMessage: string | null = null;
  toastType: 'success' | 'info' | 'error' = 'success';
  private toastTimer: any = null;

  constructor(
    public todoService: TodoService,
    private notesService: NotesService
  ) {}

  ngOnInit() {}

  isDone(item: Todo): boolean {
    return item.isCompleted === TaskStatus.Completed || item.isCompleted === 'Completed';
  }

  onChange(item: Todo, event: any) {
    if (item.id === undefined) return;
    const status = event.target.checked ? TaskStatus.Completed : TaskStatus.Incomplete;
    this.todoService.toggleTodo(item.id, status);
  }

  startEdit(item: Todo) {
    this.editingId = item.id;
    this.editTitle = item.title;
    this.editContent = item.content || '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editTitle = '';
    this.editContent = '';
  }

  saveEdit(item: Todo) {
    if (!this.editTitle.trim()) {
      this.showToast('Please enter a task title.', 'error');
      return;
    }

    this.todoService.updateTodo(item.id, {
      title: this.editTitle.trim(),
      content: this.editContent.trim(),
    });

    this.editingId = null;
    this.showToast('Task updated successfully!', 'success');
  }

  deleteItem(item: Todo) {
    if (confirm(`Are you sure you want to delete task "${item.title}"?`)) {
      this.todoService.deleteTodo(item.id);
      this.showToast('Task deleted.', 'info');
    }
  }

  saveAsNote(item: Todo) {
    const note = this.notesService.addNote({
      title: item.title,
      content: item.content || `Task details for: ${item.title}\nStatus: ${this.isDone(item) ? 'Completed' : 'Pending'}`,
      tags: ['TaskBoard', 'ActionItem'],
    });

    this.showToast(`Saved task as Note "${note.title}" in Notes Editor! 📝`, 'success');
  }

  private showToast(msg: string, type: 'success' | 'info' | 'error' = 'success') {
    this.toastMessage = msg;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }
}
