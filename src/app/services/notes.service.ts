import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface INoteModel {
  id: number;
  content: string;
  title: string;
  modifiedTime: string;
  currentTime: string;
  tags?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private readonly STORAGE_KEY = 'notes_data';

  private getDateStringServ = (timestamp: number | string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
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

  private defaultNotes: INoteModel[] = [
    {
      id: 0,
      content:
        'Team Sync Notes:\n- Need to finalize Q3 product roadmap\n- Discuss frontend migration to modern Angular\n- Set up Google Gemini AI endpoints for notes summarization\n- Check on deployment pipeline and automated tests',
      title: 'Weekly Team Sync',
      modifiedTime: this.getDateStringServ(Date.now()),
      currentTime: this.getDateStringServ(Date.now()).split('at')[1],
      tags: ['Work', 'Planning'],
    },
    {
      id: 1,
      content:
        'Ideas for improving productivity:\n1. Use time blocking for deep coding sessions\n2. Automate repetitive task extraction using LLMs\n3. Review priorities every Monday morning',
      title: 'Productivity Tips',
      modifiedTime: this.getDateStringServ(Date.now()),
      currentTime: this.getDateStringServ(Date.now()).split('at')[1],
      tags: ['Personal', 'Productivity'],
    },
    {
      id: 2,
      content:
        'Grocery & Errands:\n- Fresh fruits (apples, blueberries, avocados)\n- Almond milk, sourdough bread, oat clusters\n- Stop by the post office to pick up delivery',
      title: 'Weekend Errands',
      modifiedTime: this.getDateStringServ(Date.now()),
      currentTime: this.getDateStringServ(Date.now()).split('at')[1],
      tags: ['Personal'],
    },
  ];

  private notesSubject = new BehaviorSubject<INoteModel[]>(this.loadNotes());
  public notes$: Observable<INoteModel[]> = this.notesSubject.asObservable();

  constructor() {}

  private loadNotes(): INoteModel[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse notes from storage, using defaults');
      }
    }
    return this.defaultNotes;
  }

  private saveNotes(notes: INoteModel[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
    this.notesSubject.next([...notes]);
  }

  getNotes(): INoteModel[] {
    return this.notesSubject.getValue();
  }

  getNoteById(id: number): INoteModel | undefined {
    return this.getNotes().find((n) => n.id === id);
  }

  addNote(data: { title: string; content: string; tags?: string[] }): INoteModel {
    const current = this.getNotes();
    const maxId = current.length > 0 ? Math.max(...current.map((n) => n.id)) : 0;
    const now = Date.now();

    const newNote: INoteModel = {
      id: maxId + 1,
      title: data.title || `Untitled Note ${maxId + 1}`,
      content: data.content || '',
      tags: data.tags || [],
      modifiedTime: this.getDateStringServ(now),
      currentTime: this.getDateStringServ(now).split('at')[1],
    };

    const updated = [newNote, ...current];
    this.saveNotes(updated);
    return newNote;
  }

  updateNote(id: number, updates: Partial<INoteModel>): boolean {
    const current = this.getNotes();
    const idx = current.findIndex((n) => n.id === id);
    if (idx === -1) return false;

    current[idx] = {
      ...current[idx],
      ...updates,
      modifiedTime: this.getDateStringServ(Date.now()),
    };

    this.saveNotes(current);
    return true;
  }

  deleteNote(id: number): boolean {
    const current = this.getNotes();
    const filtered = current.filter((n) => n.id !== id);
    if (filtered.length === current.length) return false;

    this.saveNotes(filtered);
    return true;
  }

  searchNotes(query: string): INoteModel[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getNotes();

    return this.getNotes().filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(q)) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }
}
