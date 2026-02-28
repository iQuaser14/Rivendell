// Hand-written types matching SQL migrations.
// Follows Supabase Database type pattern.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          id: string;
          ticker: string;
          name: string | null;
          isin: string | null;
          asset_class: string;
          currency: string;
          exchange: string | null;
          sector: string | null;
          industry: string | null;
          country: string | null;
          region: string | null;
          metadata: Json;
          is_benchmark: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          name?: string | null;
          isin?: string | null;
          asset_class: string;
          currency: string;
          exchange?: string | null;
          sector?: string | null;
          industry?: string | null;
          country?: string | null;
          region?: string | null;
          metadata?: Json;
          is_benchmark?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['assets']['Insert']>;
      };
      cash_account: {
        Row: {
          id: string;
          currency: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          currency: string;
          balance?: number;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cash_account']['Insert']>;
      };
      cash_flows: {
        Row: {
          id: string;
          flow_date: string;
          flow_type: string;
          amount: number;
          currency: string;
          fx_rate_to_eur: number | null;
          amount_eur: number | null;
          asset_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          flow_date: string;
          flow_type: string;
          amount: number;
          currency: string;
          fx_rate_to_eur?: number | null;
          amount_eur?: number | null;
          asset_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cash_flows']['Insert']>;
      };
      trades: {
        Row: {
          id: string;
          asset_id: string;
          trade_date: string;
          settlement_date: string | null;
          side: string;
          quantity: number;
          price: number;
          currency: string;
          fx_rate_to_eur: number;
          gross_amount: number;
          gross_amount_eur: number;
          commission: number;
          tax: number;
          net_amount: number;
          net_amount_eur: number;
          notes: string | null;
          tags: string[] | null;
          trade_group: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          trade_date: string;
          settlement_date?: string | null;
          side: string;
          quantity: number;
          price: number;
          currency: string;
          fx_rate_to_eur: number;
          gross_amount: number;
          gross_amount_eur: number;
          commission?: number;
          tax?: number;
          net_amount: number;
          net_amount_eur: number;
          notes?: string | null;
          tags?: string[] | null;
          trade_group?: string | null;
          source?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['trades']['Insert']>;
      };
      positions: {
        Row: {
          id: string;
          asset_id: string;
          quantity: number;
          avg_cost_local: number;
          avg_cost_eur: number;
          avg_fx_rate: number;
          total_cost_eur: number;
          first_trade_date: string;
          last_trade_date: string;
          realized_pnl_local: number;
          realized_pnl_eur: number;
          realized_fx_pnl_eur: number;
          trade_group: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          quantity: number;
          avg_cost_local: number;
          avg_cost_eur: number;
          avg_fx_rate: number;
          total_cost_eur: number;
          first_trade_date: string;
          last_trade_date: string;
          realized_pnl_local?: number;
          realized_pnl_eur?: number;
          realized_fx_pnl_eur?: number;
          trade_group?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['positions']['Insert']>;
      };
      position_snapshots: {
        Row: {
          id: string;
          snapshot_date: string;
          asset_id: string;
          quantity: number;
          avg_cost_local: number;
          avg_cost_eur: number;
          avg_fx_rate: number;
          market_price_local: number;
          market_price_eur: number;
          fx_rate_to_eur: number;
          market_value_local: number;
          market_value_eur: number;
          cost_basis_eur: number;
          unrealized_pnl_eur: number;
          unrealized_pnl_pct: number;
          local_return_pct: number;
          fx_impact_pct: number;
          total_return_pct: number;
          weight_pct: number;
          contribution_to_return: number | null;
        };
        Insert: {
          id?: string;
          snapshot_date: string;
          asset_id: string;
          quantity: number;
          avg_cost_local: number;
          avg_cost_eur: number;
          avg_fx_rate: number;
          market_price_local: number;
          market_price_eur: number;
          fx_rate_to_eur: number;
          market_value_local: number;
          market_value_eur: number;
          cost_basis_eur: number;
          unrealized_pnl_eur: number;
          unrealized_pnl_pct: number;
          local_return_pct: number;
          fx_impact_pct: number;
          total_return_pct: number;
          weight_pct: number;
          contribution_to_return?: number | null;
        };
        Update: Partial<Database['public']['Tables']['position_snapshots']['Insert']>;
      };
      portfolio_snapshots: {
        Row: {
          id: string;
          snapshot_date: string;
          total_equity_eur: number;
          total_invested_eur: number;
          total_cash_eur: number;
          cash_breakdown: Json;
          daily_pnl_eur: number | null;
          daily_return_pct: number | null;
          modified_dietz_daily: number | null;
          cumulative_twr: number | null;
          wtd_return_pct: number | null;
          mtd_return_pct: number | null;
          ytd_return_pct: number | null;
          itd_return_pct: number | null;
          mwr_ytd: number | null;
          volatility_30d: number | null;
          sharpe_ratio_ytd: number | null;
          sortino_ratio_ytd: number | null;
          max_drawdown_ytd: number | null;
          current_drawdown: number | null;
          benchmark_msci_world_eur: number | null;
          benchmark_sp500_eur: number | null;
          excess_return_msci: number | null;
          excess_return_sp500: number | null;
          attribution_summary: Json | null;
          allocation_by_class: Json | null;
          allocation_by_sector: Json | null;
          allocation_by_region: Json | null;
          allocation_by_currency: Json | null;
          gross_exposure: number | null;
          net_exposure: number | null;
          long_exposure: number | null;
          short_exposure: number | null;
        };
        Insert: {
          id?: string;
          snapshot_date: string;
          total_equity_eur: number;
          total_invested_eur: number;
          total_cash_eur: number;
          cash_breakdown: Json;
          daily_pnl_eur?: number | null;
          daily_return_pct?: number | null;
          modified_dietz_daily?: number | null;
          cumulative_twr?: number | null;
          wtd_return_pct?: number | null;
          mtd_return_pct?: number | null;
          ytd_return_pct?: number | null;
          itd_return_pct?: number | null;
          mwr_ytd?: number | null;
          volatility_30d?: number | null;
          sharpe_ratio_ytd?: number | null;
          sortino_ratio_ytd?: number | null;
          max_drawdown_ytd?: number | null;
          current_drawdown?: number | null;
          benchmark_msci_world_eur?: number | null;
          benchmark_sp500_eur?: number | null;
          excess_return_msci?: number | null;
          excess_return_sp500?: number | null;
          attribution_summary?: Json | null;
          allocation_by_class?: Json | null;
          allocation_by_sector?: Json | null;
          allocation_by_region?: Json | null;
          allocation_by_currency?: Json | null;
          gross_exposure?: number | null;
          net_exposure?: number | null;
          long_exposure?: number | null;
          short_exposure?: number | null;
        };
        Update: Partial<Database['public']['Tables']['portfolio_snapshots']['Insert']>;
      };
      market_data: {
        Row: {
          id: string;
          asset_id: string;
          date: string;
          open: number | null;
          high: number | null;
          low: number | null;
          close: number;
          adj_close: number | null;
          volume: number | null;
          source: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          date: string;
          open?: number | null;
          high?: number | null;
          low?: number | null;
          close: number;
          adj_close?: number | null;
          volume?: number | null;
          source?: string;
        };
        Update: Partial<Database['public']['Tables']['market_data']['Insert']>;
      };
      fx_rates: {
        Row: {
          id: string;
          date: string;
          base_currency: string;
          quote_currency: string;
          rate: number;
          source: string;
        };
        Insert: {
          id?: string;
          date: string;
          base_currency?: string;
          quote_currency: string;
          rate: number;
          source?: string;
        };
        Update: Partial<Database['public']['Tables']['fx_rates']['Insert']>;
      };
      theses: {
        Row: {
          id: string;
          name: string;
          trade_group: string | null;
          thesis: string;
          conviction: string | null;
          status: string;
          entry_date: string | null;
          target_exit_date: string | null;
          catalysts: string[] | null;
          risk_factors: string[] | null;
          target_return_pct: number | null;
          stop_loss_pct: number | null;
          actual_return_pct: number | null;
          actual_return_local_pct: number | null;
          actual_fx_impact_pct: number | null;
          notes: string | null;
          created_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          trade_group?: string | null;
          thesis: string;
          conviction?: string | null;
          status?: string;
          entry_date?: string | null;
          target_exit_date?: string | null;
          catalysts?: string[] | null;
          risk_factors?: string[] | null;
          target_return_pct?: number | null;
          stop_loss_pct?: number | null;
          actual_return_pct?: number | null;
          actual_return_local_pct?: number | null;
          actual_fx_impact_pct?: number | null;
          notes?: string | null;
          created_at?: string;
          closed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['theses']['Insert']>;
      };
      reports: {
        Row: {
          id: string;
          report_type: string;
          period_start: string;
          period_end: string;
          title: string;
          content: Json;
          html_content: string | null;
          email_sent: boolean;
          email_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_type: string;
          period_start: string;
          period_end: string;
          title: string;
          content: Json;
          html_content?: string | null;
          email_sent?: boolean;
          email_sent_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reports']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          asset_id: string | null;
          thesis_id: string | null;
          alert_type: string;
          threshold: number | null;
          is_triggered: boolean;
          is_active: boolean;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id?: string | null;
          thesis_id?: string | null;
          alert_type: string;
          threshold?: number | null;
          is_triggered?: boolean;
          is_active?: boolean;
          message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
    };
    Views: {
      v_portfolio_current: {
        Row: {
          asset_id: string;
          ticker: string;
          name: string | null;
          asset_class: string;
          sector: string | null;
          country: string | null;
          region: string | null;
          trading_currency: string;
          quantity: number;
          avg_cost_local: number;
          avg_cost_eur: number;
          avg_fx_rate: number;
          total_cost_eur: number;
          realized_pnl_eur: number;
          realized_fx_pnl_eur: number;
          trade_group: string | null;
          market_price_local: number | null;
          market_price_eur: number | null;
          fx_rate_to_eur: number | null;
          market_value_eur: number | null;
          unrealized_pnl_eur: number | null;
          unrealized_pnl_pct: number | null;
          local_return_pct: number | null;
          fx_impact_pct: number | null;
          total_return_pct: number | null;
          weight_pct: number | null;
          contribution_to_return: number | null;
        };
      };
      v_cash_summary: {
        Row: {
          currency: string;
          balance: number;
          fx_rate_to_eur: number;
          balance_eur: number | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
