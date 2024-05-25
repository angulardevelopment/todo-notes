import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TaskStatus } from '../Constants/todo-status';
import { Todo } from '../interfaces/todo';
import { TodoService } from '../todo.service';


@Component({
  selector: 'notes-app',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class NotesComponent implements OnInit {


  taskStatus = TaskStatus;
  taskList: Todo[] = this.todoService.todoList;
  selectedItem: string;

  constructor(public todoService: TodoService) { }

  ngOnInit() {
  }

  onSelected(event): void {
		this.selectedItem = event.target.value;
	}
}


