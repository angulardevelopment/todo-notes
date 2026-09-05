import { Component, OnInit } from '@angular/core';
import { TodoService } from '../todo.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-todo',
  templateUrl: './add-todo.component.html',
  styleUrls: ['./add-todo.component.css'],
  imports: [FormsModule]
})
export class AddTodoComponent implements OnInit {
  todo = '';
  title = '';

  constructor(public todoService: TodoService) {}

  ngOnInit() {}

  onSubmit() {
    const { todo, title } = this;
    this.todoService.addTodo({ todo, title });
    this.todo = '';
  }
}
