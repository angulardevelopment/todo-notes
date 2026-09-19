import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { TaskStatus } from '../Constants/todo-status';
import { Todo } from '../interfaces/todo';
import { TodoService } from '../todo.service';
import { TodoListComponent } from '../todo-list/todo-list.component';
import { AddTodoComponent } from '../add-todo/add-todo.component';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AgentService } from '../../services/agent.service';

@Component({
  selector: 'notes-app',
  standalone: true,
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
  imports: [CommonModule, TodoListComponent, AddTodoComponent]
})
export class NotesComponent implements OnInit, OnDestroy {
  taskStatus = TaskStatus;
  taskList: Todo[] = [];
  selectedItem: string = TaskStatus.All;

  private sub: Subscription | null = null;

  constructor(
    public todoService: TodoService,
    public agentService: AgentService,
    private cdr: ChangeDetectorRef
  ) { }

  triggerStandup(): void {
    this.agentService.sendMessage("Give me a daily morning standup briefing: review my pending tasks, recommend top 3 focus priorities, and flag any overdue/stale items.");
  }

  ngOnInit() {
    this.sub = this.todoService.todos$.subscribe((todos) => {
      this.refreshList(todos);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  get completedCount(): number {
    return this.todoService.todoList.filter(
      t => t.isCompleted === TaskStatus.Completed || t.isCompleted === 'Completed' || (t.isCompleted as any) === 1
    ).length;
  }

  onSelected(event: any): void {
    this.selectedItem = event.target.value;
    this.refreshList(this.todoService.todoList);
    this.cdr.detectChanges();
  }

  private refreshList(allTodos: Todo[]): void {
    if (this.selectedItem === this.taskStatus.All) {
      this.taskList = [...allTodos];
    } else {
      this.taskList = allTodos.filter(
        item => String(item.isCompleted) === String(this.selectedItem)
      );
    }
  }
}
