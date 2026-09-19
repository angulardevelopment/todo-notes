import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TaskStatus } from './Constants/todo-status';
import { Todo } from './interfaces/todo';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  getDateStringServ = (timestamp: number | string) => {
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
    const plus0 = (num: number) => `0${num.toString()}`.slice(-2);

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

  private readonly STORAGE_KEY = 'smartnotes_tasks_v1';

  private defaultTodos: Todo[] = [
    {
      id: 0,
      content: 'Review Q3 product roadmap and prepare presentation for sync',
      title: 'Review Product Roadmap',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      isCompleted: TaskStatus.Incomplete,
    },
    {
      id: 1,
      content: 'Complete initial setup of Gemini Function Calling agent copilot',
      title: 'Setup Gemini Copilot',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      isCompleted: TaskStatus.Completed,
    },
    {
      id: 2,
      content: 'Index knowledge base into vector embeddings for grounded RAG',
      title: 'Index Notes Embeddings',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      isCompleted: TaskStatus.Incomplete,
    },
  ];

  private loadInitialTodos(): Todo[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('[TodoService] Failed to parse tasks from localStorage:', e);
      }
    }
    return this.defaultTodos;
  }

  private _todos: Todo[] = this.loadInitialTodos();
  private todosSubject = new BehaviorSubject<Todo[]>(this._todos);
  public todos$: Observable<Todo[]> = this.todosSubject.asObservable();

  private saveTodos(todos: Todo[]): void {
    this._todos = todos;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.warn('[TodoService] Could not save tasks to localStorage:', e);
    }
    this.todosSubject.next([...todos]);
  }

  get todoList(): Todo[] {
    return this.todosSubject.getValue();
  }

  set todoList(val: Todo[]) {
    this.saveTodos(val);
  }

  addTodo(obj: { title: string; todo?: string; content?: string }) {
    const current = this.todosSubject.getValue();
    const maxId = current.length > 0 ? Math.max(...current.map((t) => t.id)) : 0;
    const id = maxId + 1;

    const item: Todo = {
      id: id,
      isCompleted: TaskStatus.Incomplete,
      title: obj.title || 'New Task',
      content: obj.todo || obj.content || '',
      modifiedTime: this.getDateStringServ(new Date().getTime()),
      currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
    };

    const updated = [item, ...current];
    this.saveTodos(updated);
  }

  addMultipleTodos(items: Array<{ title: string; content?: string }>) {
    if (!items || !items.length) return;
    const current = this.todosSubject.getValue();
    let maxId = current.length > 0 ? Math.max(...current.map((t) => t.id)) : 0;

    const newTodos: Todo[] = items.map((item) => {
      maxId++;
      return {
        id: maxId,
        isCompleted: TaskStatus.Incomplete,
        title: item.title,
        content: item.content || item.title,
        modifiedTime: this.getDateStringServ(new Date().getTime()),
        currentTime: this.getDateStringServ(new Date().getTime()).split('at')[1],
      };
    });

    const updated = [...newTodos, ...current];
    this.saveTodos(updated);
  }

  toggleTodo(id: number, isCompleted: TaskStatus) {
    const current = this.todosSubject.getValue();
    const updated = current.map((item) =>
      item.id === id ? { ...item, isCompleted } : item
    );
    this.saveTodos(updated);
  }

  updateTodo(id: number, changes: { title?: string; content?: string }) {
    const current = this.todosSubject.getValue();
    const now = Date.now();
    const updated = current.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          title: changes.title !== undefined && changes.title.trim().length > 0 ? changes.title.trim() : item.title,
          content: changes.content !== undefined ? changes.content.trim() : item.content,
          modifiedTime: this.getDateStringServ(now),
          currentTime: this.getDateStringServ(now).split('at')[1],
        };
      }
      return item;
    });
    this.saveTodos(updated);
  }

  deleteTodo(id: number) {
    const current = this.todosSubject.getValue();
    const updated = current.filter((item) => item.id !== id);
    this.saveTodos(updated);
  }
}
