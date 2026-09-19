import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface QueryCostRecord {
  id: string;
  timestamp: string;
  operation: string; // e.g., 'Summarize Note', 'Polish Tone', 'RAG Synthesis', 'Vector Embedding', 'Copilot Chat'
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
}

export interface CostSummary {
  totalQueries: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  freeTierQueriesRemaining: number; // Google AI Studio free tier: 1500 RPD
}

export interface ScaleSimulationParams {
  dailyActiveUsers: number;
  notesPerUserPerDay: number;
  aiQueriesPerUserPerDay: number;
  avgInputTokensPerQuery: number;
  avgOutputTokensPerQuery: number;
  model: 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
}

export interface ScaleProjectionResult {
  dailyQueries: number;
  monthlyQueries: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  monthlyTotalTokens: number;
  monthlyGeminiCostUsd: number;
  monthlyEmbeddingCostUsd: number;
  monthlyHostingCostUsd: number;
  monthlyTotalCostUsd: number;
  costPerUserPerMonthUsd: number;
  competitors: {
    name: string;
    monthlyCostUsd: number;
    differenceUsd: number;
    differencePercentage: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class CostTrackerService {
  private readonly STORAGE_KEY = 'ai_cost_telemetry_v1';
  private readonly FREE_TIER_DAILY_LIMIT = 1500;

  // Official Pricing per 1 Million Tokens (USD)
  // Gemini 2.0 Flash: $0.10 / 1M input, $0.40 / 1M output
  // Gemini 1.5 Flash: $0.075 / 1M input, $0.30 / 1M output
  // Gemini 1.5 Pro: $1.25 / 1M input, $5.00 / 1M output
  // Embedding: ~$0.025 / 1M chars (~$0.10 / 1M tokens)
  private readonly MODEL_RATES: Record<string, { inputPerM: number; outputPerM: number }> = {
    'gemini-2.0-flash': { inputPerM: 0.10, outputPerM: 0.40 },
    'gemini-1.5-flash': { inputPerM: 0.075, outputPerM: 0.30 },
    'gemini-1.5-pro': { inputPerM: 1.25, outputPerM: 5.00 },
    'gemini-embedding-001': { inputPerM: 0.10, outputPerM: 0.0 },
    'default': { inputPerM: 0.10, outputPerM: 0.40 },
  };

  private recordsSubject = new BehaviorSubject<QueryCostRecord[]>([]);
  public records$: Observable<QueryCostRecord[]> = this.recordsSubject.asObservable();

  private summarySubject = new BehaviorSubject<CostSummary>({
    totalQueries: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    freeTierQueriesRemaining: this.FREE_TIER_DAILY_LIMIT,
  });
  public summary$: Observable<CostSummary> = this.summarySubject.asObservable();

  constructor() {
    this.loadRecords();
  }

  private loadRecords(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw) {
      try {
        const saved: QueryCostRecord[] = JSON.parse(raw);
        this.recordsSubject.next(saved);
        this.updateSummary(saved);
      } catch (e) {
        console.warn('[CostTrackerService] Failed to load telemetry from storage:', e);
      }
    }
  }

  private saveRecords(records: QueryCostRecord[]): void {
    try {
      // Keep most recent 100 queries in storage to avoid filling localStorage
      const trimmed = records.slice(0, 100);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('[CostTrackerService] Failed to save telemetry to storage:', e);
    }
  }

  private updateSummary(records: QueryCostRecord[]): void {
    const totalQueries = records.length;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalCostUsd = 0;

    for (const r of records) {
      totalInputTokens += r.inputTokens || 0;
      totalOutputTokens += r.outputTokens || 0;
      totalTokens += r.totalTokens || 0;
      totalCostUsd += r.estimatedCostUsd || 0;
    }

    const freeTierQueriesRemaining = Math.max(0, this.FREE_TIER_DAILY_LIMIT - totalQueries);

    this.summarySubject.next({
      totalQueries,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalCostUsd,
      freeTierQueriesRemaining,
    });
  }

  /**
   * Calculate cost in USD given model and token counts
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const rates = this.MODEL_RATES[model] || this.MODEL_RATES['default'];
    const inputCost = (inputTokens / 1_000_000) * rates.inputPerM;
    const outputCost = (outputTokens / 1_000_000) * rates.outputPerM;
    return inputCost + outputCost;
  }

  /**
   * Record a query execution
   */
  recordQuery(params: {
    operation: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    latencyMs?: number;
  }): QueryCostRecord {
    const totalTokens = (params.inputTokens || 0) + (params.outputTokens || 0);
    const estimatedCostUsd = this.calculateCost(params.model, params.inputTokens, params.outputTokens);

    const record: QueryCostRecord = {
      id: 'cost-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      operation: params.operation,
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens,
      estimatedCostUsd,
      latencyMs: params.latencyMs || 0,
    };

    const current = this.recordsSubject.getValue();
    const updated = [record, ...current];
    this.recordsSubject.next(updated);
    this.updateSummary(updated);
    this.saveRecords(updated);

    return record;
  }

  getSummary(): CostSummary {
    return this.summarySubject.getValue();
  }

  getRecords(): QueryCostRecord[] {
    return this.recordsSubject.getValue();
  }

  clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.recordsSubject.next([]);
    this.updateSummary([]);
  }

  /**
   * Interactive Scale Projection Engine
   * Calculates monthly costs and competitor comparisons for arbitrary scale parameters
   */
  calculateScaleProjections(params: ScaleSimulationParams): ScaleProjectionResult {
    const {
      dailyActiveUsers,
      notesPerUserPerDay,
      aiQueriesPerUserPerDay,
      avgInputTokensPerQuery,
      avgOutputTokensPerQuery,
      model,
    } = params;

    // Queries per day
    const dailyQueries = Math.round(dailyActiveUsers * aiQueriesPerUserPerDay);
    const monthlyQueries = dailyQueries * 30;

    // Token volumes
    const monthlyInputTokens = monthlyQueries * avgInputTokensPerQuery;
    const monthlyOutputTokens = monthlyQueries * avgOutputTokensPerQuery;
    const monthlyTotalTokens = monthlyInputTokens + monthlyOutputTokens;

    // Gemini API Cost
    const rates = this.MODEL_RATES[model] || this.MODEL_RATES['gemini-2.0-flash'];
    const monthlyGeminiCostUsd =
      (monthlyInputTokens / 1_000_000) * rates.inputPerM +
      (monthlyOutputTokens / 1_000_000) * rates.outputPerM;

    // Vector Embeddings Cost: Assume each note averages 150 words (~200 tokens)
    const dailyNewNotes = dailyActiveUsers * notesPerUserPerDay;
    const monthlyEmbeddingTokens = dailyNewNotes * 30 * 200;
    const monthlyEmbeddingCostUsd = (monthlyEmbeddingTokens / 1_000_000) * 0.10;

    // Cloud Infrastructure / Hosting Cost (Cloud Run / Firebase / Vercel serverless + DB):
    // Up to 100 DAU: Free tier ($0)
    // 1,000 DAU: ~$5/mo
    // 10,000 DAU: ~$35/mo
    // 100,000 DAU: ~$250/mo
    let monthlyHostingCostUsd = 0;
    if (dailyActiveUsers > 50000) {
      monthlyHostingCostUsd = 250 + (dailyActiveUsers - 50000) * 0.003;
    } else if (dailyActiveUsers > 5000) {
      monthlyHostingCostUsd = 35 + (dailyActiveUsers - 5000) * 0.004;
    } else if (dailyActiveUsers > 500) {
      monthlyHostingCostUsd = 5 + (dailyActiveUsers - 500) * 0.006;
    }

    const monthlyTotalCostUsd = monthlyGeminiCostUsd + monthlyEmbeddingCostUsd + monthlyHostingCostUsd;
    const costPerUserPerMonthUsd = dailyActiveUsers > 0 ? monthlyTotalCostUsd / dailyActiveUsers : 0;

    // Competitor Pricing Comparison for the exact same token volume
    // 1. OpenAI GPT-4o-mini ($0.15/M in, $0.60/M out)
    const gpt4oMiniCost = (monthlyInputTokens / 1_000_000) * 0.15 + (monthlyOutputTokens / 1_000_000) * 0.60;
    // 2. OpenAI GPT-4o ($2.50/M in, $10.00/M out)
    const gpt4oCost = (monthlyInputTokens / 1_000_000) * 2.50 + (monthlyOutputTokens / 1_000_000) * 10.00;
    // 3. Anthropic Claude 3.5 Sonnet ($3.00/M in, $15.00/M out)
    const claudeSonnetCost = (monthlyInputTokens / 1_000_000) * 3.00 + (monthlyOutputTokens / 1_000_000) * 15.00;

    const competitors = [
      {
        name: 'OpenAI GPT-4o-mini',
        monthlyCostUsd: gpt4oMiniCost,
        differenceUsd: gpt4oMiniCost - monthlyGeminiCostUsd,
        differencePercentage: Math.round(((gpt4oMiniCost - monthlyGeminiCostUsd) / gpt4oMiniCost) * 100),
      },
      {
        name: 'OpenAI GPT-4o',
        monthlyCostUsd: gpt4oCost,
        differenceUsd: gpt4oCost - monthlyGeminiCostUsd,
        differencePercentage: Math.round(((gpt4oCost - monthlyGeminiCostUsd) / gpt4oCost) * 100),
      },
      {
        name: 'Claude 3.5 Sonnet',
        monthlyCostUsd: claudeSonnetCost,
        differenceUsd: claudeSonnetCost - monthlyGeminiCostUsd,
        differencePercentage: Math.round(((claudeSonnetCost - monthlyGeminiCostUsd) / claudeSonnetCost) * 100),
      },
    ];

    return {
      dailyQueries,
      monthlyQueries,
      monthlyInputTokens,
      monthlyOutputTokens,
      monthlyTotalTokens,
      monthlyGeminiCostUsd,
      monthlyEmbeddingCostUsd,
      monthlyHostingCostUsd,
      monthlyTotalCostUsd,
      costPerUserPerMonthUsd,
      competitors,
    };
  }
}
