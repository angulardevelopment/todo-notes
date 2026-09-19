import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AiSettingsComponent } from './components/ai-settings/ai-settings.component';
import { AgentCopilotComponent } from './components/agent-copilot/agent-copilot.component';
import { AiCostDashboardComponent } from './components/ai-cost-dashboard/ai-cost-dashboard.component';
import { AiService } from './services/ai.service';
import { CostTrackerService } from './services/cost-tracker.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    AiSettingsComponent,
    AgentCopilotComponent,
    AiCostDashboardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  showAiSettings = false;
  showCostDashboard = false;

  constructor(
    public aiService: AiService,
    public costTracker: CostTrackerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  openSettings(): void {
    this.showAiSettings = true;
    this.cdr.markForCheck();
  }

  closeSettings(): void {
    this.showAiSettings = false;
    this.cdr.markForCheck();
  }

  openCostDashboard(): void {
    this.showCostDashboard = true;
    this.cdr.markForCheck();
  }

  closeCostDashboard(): void {
    this.showCostDashboard = false;
    this.cdr.markForCheck();
  }

  isAiReady(): boolean {
    return this.aiService.hasApiKey();
  }

  formatUsd(amount: number): string {
    if (!amount || amount === 0) return '$0.00';
    if (amount < 0.01) return `$${amount.toFixed(4)}`;
    return `$${amount.toFixed(2)}`;
  }
}
