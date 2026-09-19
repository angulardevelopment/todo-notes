import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActionItem, AiService } from '../services/ai.service';
import { TodoService } from '../notes-app/todo.service';
import { INoteModel, NotesService } from '../services/notes.service';
import { RagAnswer, RagService, SemanticSearchResult } from '../services/rag.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-todo',
  standalone: true,
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css'],
  imports: [FormsModule, CommonModule]
})
export class TodoComponent implements OnInit, OnDestroy {
  @ViewChild('inputToFocus') inputElement: ElementRef;

  searchNotes = '';
  selectedNote: INoteModel | null = null;
  taskList: INoteModel[] = [];
  enableDisableSpan = false;

  // AI state
  isAiLoading = false;
  aiLoadingMessage = '';
  aiResult: {
    action: string;
    text?: string;
    items?: ActionItem[];
    error?: string;
  } | null = null;

  showAiCustomPrompt = false;
  customPromptText = '';
  toastMessage: { type: 'success' | 'error'; text: string } | null = null;

  // RAG State
  showRagSearch = false;
  ragQuery = '';
  isRagLoading = false;
  ragStatusMsg = '';
  ragAnswer: RagAnswer | null = null;
  semanticResults: SemanticSearchResult[] = [];
  Math = Math;

  private notesSub: Subscription | null = null;

  constructor(
    public aiService: AiService,
    public todoService: TodoService,
    public notesService: NotesService,
    public ragService: RagService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.notesSub = this.notesService.notes$.subscribe((notes) => {
      this.taskList = notes;
      if (!this.selectedNote && notes.length > 0) {
        this.selectedNote = notes[0];
      } else if (this.selectedNote) {
        // Keep active note updated if modified
        const found = notes.find((n) => n.id === this.selectedNote!.id);
        if (found) {
          this.selectedNote = found;
        } else if (notes.length > 0) {
          this.selectedNote = notes[0];
        } else {
          this.selectedNote = null;
        }
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.notesSub) {
      this.notesSub.unsubscribe();
    }
  }

  get filteredNotes(): INoteModel[] {
    const q = this.searchNotes?.toLowerCase().trim();
    if (!q) {
      return this.taskList;
    }
    return this.taskList.filter(item =>
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.content && item.content.toLowerCase().includes(q)) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  addNote(): void {
    this.enableDisableSpan = false;
    const newNote = this.notesService.addNote({
      title: 'Untitled Note',
      content: '',
      tags: []
    });
    this.selectedNote = newNote;
    this.cdr.detectChanges();

    setTimeout(() => {
      if (this.inputElement) {
        this.inputElement.nativeElement.focus();
      }
    }, 50);
  }

  selectNote(note: INoteModel): void {
    this.selectedNote = note;
    this.aiResult = null;
  }

  deleteNote(): void {
    if (!this.selectedNote) return;
    this.notesService.deleteNote(this.selectedNote.id);
    this.showToast('success', 'Note deleted.');
  }

  saveNote(): void {
    if (!this.selectedNote) return;
    this.notesService.updateNote(this.selectedNote.id, {
      title: this.selectedNote.title,
      content: this.selectedNote.content,
      tags: this.selectedNote.tags
    });
    this.showToast('success', 'Note saved successfully!');
  }

  saveNotesToStorage(): void {
    if (this.selectedNote) {
      this.notesService.updateNote(this.selectedNote.id, {
        title: this.selectedNote.title,
        content: this.selectedNote.content,
        tags: this.selectedNote.tags
      });
    }
  }

  // ==========================================
  // AI Feature Handlers
  // ==========================================

  async runAiAction(action: 'summarize' | 'grammar' | 'professional' | 'bullet' | 'expand' | 'actionItems' | 'tags'): Promise<void> {
    if (!this.selectedNote) {
      this.showToast('error', 'Please select a note first.');
      return;
    }

    if (!this.selectedNote.content?.trim()) {
      this.showToast('error', 'Note content is empty. Add some text first.');
      return;
    }

    this.isAiLoading = true;
    this.aiResult = null;
    this.cdr.detectChanges();

    try {
      switch (action) {
        case 'summarize':
          this.aiLoadingMessage = 'Summarizing your note with Gemini...';
          this.cdr.detectChanges();
          const summary = await this.aiService.summarizeNote(this.selectedNote.content);
          this.ngZone.run(() => {
            this.aiResult = { action: 'Summary', text: summary };
          });
          break;

        case 'grammar':
          this.aiLoadingMessage = 'Correcting grammar and phrasing...';
          this.cdr.detectChanges();
          const fixed = await this.aiService.fixGrammar(this.selectedNote.content);
          this.ngZone.run(() => {
            this.aiResult = { action: 'Grammar & Clarity Fix', text: fixed };
          });
          break;

        case 'professional':
          this.aiLoadingMessage = 'Polishing into professional tone...';
          this.cdr.detectChanges();
          const prof = await this.aiService.polishNote(this.selectedNote.content, 'professional');
          this.ngZone.run(() => {
            this.aiResult = { action: 'Professional Rewrite', text: prof };
          });
          break;

        case 'bullet':
          this.aiLoadingMessage = 'Converting note into bullet points...';
          this.cdr.detectChanges();
          const bullets = await this.aiService.polishNote(this.selectedNote.content, 'bullet');
          this.ngZone.run(() => {
            this.aiResult = { action: 'Bullet Points Structure', text: bullets };
          });
          break;

        case 'expand':
          this.aiLoadingMessage = 'Expanding thoughts and adding structure...';
          this.cdr.detectChanges();
          const expanded = await this.aiService.polishNote(this.selectedNote.content, 'expand');
          this.ngZone.run(() => {
            this.aiResult = { action: 'Expanded Draft', text: expanded };
          });
          break;

        case 'actionItems':
          this.aiLoadingMessage = 'Extracting actionable todo tasks...';
          this.cdr.detectChanges();
          const items = await this.aiService.extractActionItems(this.selectedNote.content);
          this.ngZone.run(() => {
            this.aiResult = { action: 'Extracted Tasks', items };
          });
          break;

        case 'tags':
          this.aiLoadingMessage = 'Generating smart tags...';
          this.cdr.detectChanges();
          const tags = await this.aiService.suggestTags(this.selectedNote.content);
          this.ngZone.run(() => {
            if (tags.length > 0 && this.selectedNote) {
              const updatedTags = Array.from(new Set([...(this.selectedNote.tags || []), ...tags]));
              this.notesService.updateNote(this.selectedNote.id, { tags: updatedTags });
              this.showToast('success', `Added tags: ${tags.join(', ')}`);
            }
          });
          break;
      }
    } catch (err: any) {
      this.ngZone.run(() => {
        this.aiResult = { action: 'Error', error: err.message || 'An error occurred during AI processing.' };
        this.showToast('error', err.message || 'AI request failed');
      });
    } finally {
      this.ngZone.run(() => {
        this.isAiLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async generateNoteWithAi(): Promise<void> {
    const prompt = this.customPromptText.trim();
    if (!prompt) return;

    this.isAiLoading = true;
    this.aiLoadingMessage = `Drafting note: "${prompt.slice(0, 25)}..."`;
    this.cdr.detectChanges();

    try {
      const fullPrompt = `Write a comprehensive, well-structured note based on this request: "${prompt}".
Use Markdown bullet points, headings, and clear formatting.`;

      const generated = await this.aiService.generateCustomText(fullPrompt);

      this.ngZone.run(() => {
        const title = prompt.length > 30 ? prompt.slice(0, 30) + '...' : prompt;
        const newNote = this.notesService.addNote({
          title,
          content: generated,
          tags: ['AI-Draft']
        });
        this.selectedNote = newNote;
        this.customPromptText = '';
        this.showAiCustomPrompt = false;
        this.showToast('success', 'AI generated new note!');
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.showToast('error', err.message || 'Failed to generate note.');
      });
    } finally {
      this.ngZone.run(() => {
        this.isAiLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  applyAiResultReplace(): void {
    if (!this.selectedNote || !this.aiResult?.text) return;
    this.notesService.updateNote(this.selectedNote.id, { content: this.aiResult.text });
    this.aiResult = null;
    this.showToast('success', 'Note updated with AI content.');
  }

  applyAiResultAppend(): void {
    if (!this.selectedNote || !this.aiResult?.text) return;
    const newContent = `${this.selectedNote.content}\n\n---\n### AI ${this.aiResult.action}\n${this.aiResult.text}`;
    this.notesService.updateNote(this.selectedNote.id, { content: newContent });
    this.aiResult = null;
    this.showToast('success', 'AI content appended to note.');
  }

  copyAiText(): void {
    if (!this.aiResult?.text) return;
    navigator.clipboard.writeText(this.aiResult.text);
    this.showToast('success', 'Copied to clipboard!');
  }

  addTasksToTodoList(items?: ActionItem[]): void {
    const tasksToAdd = items || this.aiResult?.items;
    if (!tasksToAdd || !tasksToAdd.length) return;

    this.todoService.addMultipleTodos(tasksToAdd);
    this.showToast('success', `Added ${tasksToAdd.length} tasks to your Task Board!`);
    this.aiResult = null;
  }

  dismissAiResult(): void {
    this.aiResult = null;
  }

  showToast(type: 'success' | 'error', text: string): void {
    this.toastMessage = { type, text };
    this.cdr.detectChanges();
    setTimeout(() => {
      this.ngZone.run(() => {
        this.toastMessage = null;
        this.cdr.detectChanges();
      });
    }, 3500);
  }

  // ==========================================
  // Semantic Vector RAG Handlers
  // ==========================================

  toggleRagSearch(): void {
    this.showRagSearch = !this.showRagSearch;
    this.cdr.detectChanges();
  }

  async runAskNotesRag(): Promise<void> {
    if (!this.ragQuery?.trim()) return;
    this.isRagLoading = true;
    this.ragStatusMsg = 'Searching vectors & synthesizing answer with Gemini...';
    this.ragAnswer = null;
    this.semanticResults = [];
    this.cdr.detectChanges();

    try {
      const answer = await this.ragService.askNotesRag(this.ragQuery.trim());
      this.ngZone.run(() => {
        this.ragAnswer = answer;
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.showToast('error', err.message || 'RAG Q&A failed.');
      });
    } finally {
      this.ngZone.run(() => {
        this.isRagLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  async runSemanticVectorSearch(): Promise<void> {
    if (!this.ragQuery?.trim()) return;
    this.isRagLoading = true;
    this.ragStatusMsg = 'Calculating cosine similarities across note vectors...';
    this.ragAnswer = null;
    this.semanticResults = [];
    this.cdr.detectChanges();

    try {
      const results = await this.ragService.semanticSearch(this.ragQuery.trim(), 4);
      this.ngZone.run(() => {
        this.semanticResults = results;
      });
    } catch (err: any) {
      this.ngZone.run(() => {
        this.showToast('error', err.message || 'Semantic search failed.');
      });
    } finally {
      this.ngZone.run(() => {
        this.isRagLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  openCitedNote(id: number): void {
    const found = this.taskList.find(n => n.id === id);
    if (found) {
      this.selectNote(found);
      this.showToast('success', `Opened note: "${found.title}"`);
    }
  }

  dismissRag(): void {
    this.ragAnswer = null;
    this.semanticResults = [];
  }
}
