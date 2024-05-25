import { Component, Input, OnInit } from '@angular/core';
import { TaskStatus } from '../Constants/todo-status';
import { TodoService } from '../todo.service';

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
})
export class TodoListComponent implements OnInit {
  @Input() taskList;
  @Input() selectedItem;

  constructor(public todoService: TodoService) {}

  ngOnInit() {}

  ngOnChanges(changes) {
    const selectedItem = changes.selectedItem.currentValue;
    if (selectedItem) {
      this.taskList =
        selectedItem != TaskStatus.All
          ? this.todoService.todoList.filter((item) => item.isCompleted == selectedItem)
          : this.todoService.todoList;
    }
  }

  onChange(item, event) {
    let index = this.todoService.todoList.findIndex((data) => data.id == item.id);

  
    this.todoService.todoList[index].isCompleted = event.target.checked ? TaskStatus.Completed: TaskStatus.Incomplete;
  }
}
