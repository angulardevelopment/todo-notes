import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TodoComponent } from './todo/todo.component';
import { FormsModule } from '@angular/forms';
import { SearchPipe } from './search.pipe';
import { NotesComponent } from './notes-app/todo/todo.component';
import { TodoListComponent } from './notes-app/todo-list/todo-list.component';
import { AddTodoComponent } from './notes-app/add-todo/add-todo.component';
import { TodoService } from './notes-app/todo.service';

@NgModule({
  declarations: [
    AppComponent,
    TodoComponent,
    SearchPipe,
    NotesComponent,
    TodoListComponent,
    AddTodoComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [TodoService],
  bootstrap: [AppComponent]
})
export class AppModule { }
