import { AfterViewChecked, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgentMessage, AgentService } from '../../services/agent.service';

@Component({
  selector: 'app-agent-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-copilot.component.html',
  styleUrls: ['./agent-copilot.component.scss']
})
export class AgentCopilotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  messages: AgentMessage[] = [];
  isThinking = false;

  quickPrompts = [
    '🌅 Give me a daily standup briefing',
    '📋 List all my pending tasks',
    '⚡ Extract tasks from my latest note',
    '📝 Create note: Q4 Goals with 3 key initiatives',
  ];

  constructor(
    public agentService: AgentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.agentService.messages$.subscribe((msgs) => {
      this.messages = msgs;
      this.cdr.detectChanges();
    });

    this.agentService.isThinking$.subscribe((thinking) => {
      this.isThinking = thinking;
      this.cdr.detectChanges();
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
    this.cdr.detectChanges();
  }

  async send(): Promise<void> {
    const text = this.userInput.trim();
    if (!text || this.isThinking) return;

    this.userInput = '';
    await this.agentService.sendMessage(text);
  }

  sendQuickPrompt(promptText: string): void {
    // Strip leading emoji
    const cleaned = promptText.replace(/^[^\w]+/, '').trim();
    this.userInput = cleaned;
    this.send();
  }

  clearHistory(): void {
    this.agentService.clearChat();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {}
    }
  }
}
