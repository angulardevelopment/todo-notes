import { Routes } from "@angular/router";
import { NotesComponent } from "./notes-app/todo/todo.component";
import { TodoComponent } from "./todo/todo.component";

export const routes: Routes = [
    { path: '', redirectTo: 'notes', pathMatch: 'full' },
    { path: 'todo', component: TodoComponent },
    { path: 'notes', component: NotesComponent },
    { path: '**', redirectTo: 'notes' },
];