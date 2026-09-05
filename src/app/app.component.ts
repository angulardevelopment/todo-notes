import { Component } from '@angular/core';
import { Routes, Router, RouterLink } from '@angular/router';
import { NotesComponent } from './notes-app/todo/todo.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [NotesComponent, RouterLink]
})
export class AppComponent {
  routes: Routes = [];

  constructor(private router: Router) {}

  ngAfterViewInit(): void {
    // Fetch the routes from the router
    this.routes = this.router.config;
    console.log(this.routes);
  }
}
