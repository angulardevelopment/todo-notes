import { Routes } from "@angular/router";
import { NotesComponent } from "./notes-app/todo/todo.component";
import { TodoComponent } from "./todo/todo.component";

export const routes: Routes = [
    { path: '', redirectTo: 'notes', pathMatch: 'full' },
    { path: 'notes', component: TodoComponent },
    { path: 'todo', component: NotesComponent },
    { path: '**', redirectTo: 'notes' },
];