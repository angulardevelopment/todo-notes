import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-todo',
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {

  @ViewChild('inputToFocus') inputElement: ElementRef;
  constructor() { }
  searchNotes = '';
  selectedNote: INoteModel;
  taskList: INoteModel[] = [];
  enableDisableSpan = true;
  primaryValue = 3;
  styleOne = false;
  ngOnInit() {

    this.taskList = [{
      id: 0,
      content: 'Blog post',
      title: 'demo1',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1]
    },
    {
      id: 1,
      content: 'Hello world',
      title: 'demo2',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1]

    },
    {
      id: 2,
      content: 'This is example Note',
      title: 'demo3',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1]

    }];
    this.selectedNote = this.taskList[0];

  }





  getDateStringServ = timestamp => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const plus0 = num => `0${num.toString()}`.slice(-2);

    const d = new Date(timestamp);

    const year = d.getFullYear();
    const date = plus0(d.getDate());
    const hour = +plus0(d.getHours());
    const minute = plus0(d.getMinutes());
    const time = (hour > 12) ? (hour - 12 + ':' + minute + ' PM') : (hour + ':' + minute + ' AM');
    return `${monthNames[d.getMonth()]} ${date}, ${year} at ${time}`;

  }
  addNote() {

    this.enableDisableSpan = false;
    const id = this.primaryValue + 1;
    const data = {id, content: '', title: `demo${id}`,
    modifiedTime: this.getDateStringServ(new Date().getTime()),
    currentTime:  this.getDateStringServ(new Date().getTime()).split('at')[1]
    };
    this.taskList.push(data);
    this.selectedNote = data;
    this.primaryValue++;
    this.inputElement.nativeElement.focus();
  }

  editNote() {
    this.enableDisableSpan = false;
  }

  deleteNote() {
    this.taskList.splice(this.selectedNote.id, 1);
  }

  saveNote() {
    this.taskList.forEach(element => {
      if (element.id === this.selectedNote.id) {
        element.modifiedTime = this.getDateStringServ(new Date().getTime());
      }
    });
    localStorage.setItem('data', JSON.stringify(this.taskList));

  }
}

interface INoteModel {
  id: number;
  content: string;
  title: string;
  modifiedTime: string;
  currentTime: string;

}
