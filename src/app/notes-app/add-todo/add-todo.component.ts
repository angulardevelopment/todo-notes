import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { TodoService } from '../todo.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';

@Component({
  selector: 'app-add-todo',
  standalone: true,
  templateUrl: './add-todo.component.html',
  styleUrls: ['./add-todo.component.css'],
  imports: [FormsModule, CommonModule]
})
export class AddTodoComponent implements OnInit {
  todo = '';
  title = '';

  isAiDecomposing = false;
  statusMessage: { type: 'success' | 'error'; text: string } | null = null;

  constructor(
    public todoService: TodoService,
    public aiService: AiService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {}

  onSubmit() {
    const { todo, title } = this;
    if (!title && !todo) return;
    this.todoService.addTodo({ todo, title });
    this.todo = '';
    this.title = '';
    this.showStatus('success', 'Task added successfully!');
  }

  async breakdownWithAi() {
    const goal = this.title || this.todo;
    if (!goal || !goal.trim()) {
      this.showStatus('error', 'Please enter a goal or task title to break down.');
      return;
    }

    this.isAiDecomposing = true;
    this.cdr.detectChanges();

    try {
      const subtasks = await this.aiService.breakdownGoalIntoTodos(goal.trim());
      this.ngZone.run(() => {
        if (subtasks && subtasks.length) {
          this.todoService.addMultipleTodos(subtasks);
          this.title = '';
          this.todo = '';
          this.showStatus('success', `✨ AI created ${subtasks.length} actionable subtasks!`);
        } else {
          this.showStatus('error', 'AI could not generate subtasks.');
        }
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.showStatus('error', err.message || 'Failed to generate subtasks.');
      });
    } finally {
      this.ngZone.run(() => {
        this.isAiDecomposing = false;
        this.cdr.detectChanges();
      });
    }
  }

  private showStatus(type: 'success' | 'error', text: string) {
    this.statusMessage = { type, text };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.ngZone.run(() => {
        this.statusMessage = null;
        this.cdr.detectChanges();
      });
    }, 4000);
  }
}
