import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiModelOption, AiService } from '../../services/ai.service';

@Component({
  selector: 'app-ai-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-settings.component.html',
  styleUrls: ['./ai-settings.component.scss']
})
export class AiSettingsComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  apiKey = '';
  showKey = false;
  selectedModel = 'gemini-3.5-flash';
  models: AiModelOption[] = [];

  isTesting = false;
  testResult: { success: boolean; message: string } | null = null;
  saveSuccess = false;

  constructor(public aiService: AiService) {}

  ngOnInit(): void {
    this.apiKey = this.aiService.getApiKey();
    this.selectedModel = this.aiService.getSelectedModel();
    this.models = this.aiService.availableModels;
  }

  async onTestConnection(): Promise<void> {
    this.testResult = null;
    this.isTesting = true;
    try {
      this.testResult = await this.aiService.testConnection(this.apiKey);
    } catch (err: any) {
      this.testResult = { success: false, message: err.message || 'Error testing connection' };
    } finally {
      this.isTesting = false;
    }
  }

  onSave(): void {
    this.aiService.setApiKey(this.apiKey);
    this.aiService.setSelectedModel(this.selectedModel);
    this.saveSuccess = true;
    setTimeout(() => {
      this.saveSuccess = false;
      this.close.emit();
    }, 1200);
  }

  onClose(): void {
    this.close.emit();
  }
}
