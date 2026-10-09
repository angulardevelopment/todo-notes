import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CostSummary,
  CostTrackerService,
  QueryCostRecord,
  ScaleProjectionResult,
  ScaleSimulationParams,
} from '../../services/cost-tracker.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-ai-cost-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-cost-dashboard.component.html',
  styleUrls: ['./ai-cost-dashboard.component.scss'],
})
export class AiCostDashboardComponent implements OnInit {
  @Output() close = new EventEmitter<void>();

  private costTracker = inject(CostTrackerService);

  public activeTab: 'telemetry' | 'scaling' | 'optimization' = 'scaling';

  public summary$: Observable<CostSummary> = this.costTracker.summary$;
  public records$: Observable<QueryCostRecord[]> = this.costTracker.records$;

  // Simulator state
  public simParams: ScaleSimulationParams = {
    dailyActiveUsers: 1000,
    notesPerUserPerDay: 2,
    aiQueriesPerUserPerDay: 8,
    avgInputTokensPerQuery: 350,
    avgOutputTokensPerQuery: 180,
    model: 'gemini-3.6-flash',
  };

  public projection!: ScaleProjectionResult;

  ngOnInit(): void {
    this.recalculate();
  }

  setTab(tab: 'telemetry' | 'scaling' | 'optimization'): void {
    this.activeTab = tab;
  }

  applyPreset(preset: 'starter' | 'growth' | 'scale' | 'enterprise'): void {
    switch (preset) {
      case 'starter':
        this.simParams.dailyActiveUsers = 100;
        this.simParams.notesPerUserPerDay = 1;
        this.simParams.aiQueriesPerUserPerDay = 5;
        break;
      case 'growth':
        this.simParams.dailyActiveUsers = 1000;
        this.simParams.notesPerUserPerDay = 2;
        this.simParams.aiQueriesPerUserPerDay = 8;
        break;
      case 'scale':
        this.simParams.dailyActiveUsers = 10000;
        this.simParams.notesPerUserPerDay = 3;
        this.simParams.aiQueriesPerUserPerDay = 12;
        break;
      case 'enterprise':
        this.simParams.dailyActiveUsers = 100000;
        this.simParams.notesPerUserPerDay = 4;
        this.simParams.aiQueriesPerUserPerDay = 15;
        break;
    }
    this.recalculate();
  }

  recalculate(): void {
    this.projection = this.costTracker.calculateScaleProjections(this.simParams);
  }

  clearLedger(): void {
    if (confirm('Clear query cost history for this session?')) {
      this.costTracker.clearHistory();
    }
  }

  formatUsd(amount: number): string {
    if (amount === 0) return '$0.00';
    if (amount < 0.01) {
      return `$${amount.toFixed(5)}`;
    }
    if (amount < 1) {
      return `$${amount.toFixed(3)}`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatTokens(tokens: number): string {
    if (tokens >= 1_000_000_000) {
      return `${(tokens / 1_000_000_000).toFixed(2)}B`;
    }
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(2)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(1)}k`;
    }
    return tokens.toLocaleString();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cost-modal-backdrop')) {
      this.close.emit();
    }
  }
}
