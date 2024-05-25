import { Injectable } from '@angular/core';
import { TaskStatus } from './Constants/todo-status';
import { Todo } from './interfaces/todo';

@Injectable()
export class TodoService {
  getDateStringServ = (timestamp) => {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const plus0 = (num) => `0${num.toString()}`.slice(-2);

    const d = new Date(timestamp);

    const year = d.getFullYear();
    const date = plus0(d.getDate());
    const hour = +plus0(d.getHours());
    const minute = plus0(d.getMinutes());
    const time =
      hour > 12
        ? hour - 12 + ':' + minute + ' PM'
        : hour + ':' + minute + ' AM';
    return `${monthNames[d.getMonth()]} ${date}, ${year} at ${time}`;
  };

  todoList: Todo[] = [
    {
      id: 0,
      content: 'Blog post',
      title: 'demo1',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      isCompleted: TaskStatus.Incomplete,
    },
    {
      id: 1,
      content: 'Hello world',
      title: 'demo2',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      isCompleted: TaskStatus.Completed,
    },
    {
      id: 2,
      content: 'This is example Note',
      title: 'demo3',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      isCompleted: TaskStatus.Incomplete,
    },
  ];

  addTodo(obj) {
    let id = this.todoList.length + 1;

    const item: Todo = {
      id: id,
      isCompleted: TaskStatus.Incomplete,
      title: obj.title,
      content: obj.todo,
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
    };
    this.todoList.unshift(item);
  }
}
