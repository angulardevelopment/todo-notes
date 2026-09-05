import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TaskStatus } from '../Constants/todo-status';
import { Todo } from '../interfaces/todo';
import { TodoService } from '../todo.service';
import { TodoListComponent } from '../todo-list/todo-list.component';
import { TodoComponent } from 'src/app/todo/todo.component';
import { AddTodoComponent } from '../add-todo/add-todo.component';


@Component({
  selector: 'notes-app',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
  imports: [TodoListComponent, AddTodoComponent]
})
export class NotesComponent implements OnInit {


  taskStatus = TaskStatus;
  taskList: Todo[] = [];
  selectedItem: string;

  constructor(public todoService: TodoService) { }

  ngOnInit() {
    this.taskList = this.todoService.todoList;
  }

  onSelected(event): void {
		this.selectedItem = event.target.value;
	}
}


