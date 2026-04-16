import { useState } from 'react';
import FinGPTNavbar from "../components/fingpt/FinGPTNavbar";
import FinGPTSidebar from "../components/fingpt/FinGPTSidebar";
import FinGPTOutput from "../components/fingpt/FinGPTOutput";
import FinGPTPromptEngine from "../components/fingpt/FinGPTPromptEngine";

export type Document = {
  id: string;
  label: string;
  tag: string;
  size: string;
};

export type Prompt = {
  id: string;
  label: string;
  icon: string;
  response: string;
};

const DOCUMENTS: Document[] = [
  { id: 'balance', label: 'Balance Sheet', tag: 'Q4 2024', size: '2.4 MB' },
  { id: 'pnl', label: 'Statement of P&L', tag: 'Q4 2024', size: '1.8 MB' },
  { id: 'cashflow', label: 'Cash Flow Statement', tag: 'Q4 2024', size: '1.2 MB' },
];

const PROMPTS: Prompt[] = [
  {
    id: 'invest',
    label: 'I am thinking to invest in this company',
    icon: '📈',
    response: `**Investment Viability Assessment**

Based on the uploaded financial statements, here is a structured investment overview:

**Revenue Trend:** The company has demonstrated consistent YoY revenue growth of **8.3%**, driven by expanding SaaS subscriptions and reduced churn (down from 14% → 9.2%).

**Profitability:** Operating margins have improved from **22.1% → 29.8%** over the last 3 fiscal years — a strong signal of operational leverage kicking in.

**Balance Sheet Health:** Current ratio stands at **2.1x**, indicating solid short-term liquidity. Long-term debt has decreased by 18% YoY, reducing refinancing risk.

**Valuation Context:** At current price levels, the company trades at **~21x forward earnings** — slightly above sector median (18x), but justified given above-average growth velocity.

**FinSight Verdict:** ✅ Conditionally Favorable — suitable for growth-oriented portfolios with a 2–4 year horizon. Monitor debt covenant compliance in Q1 2025.`,
  },
  {
    id: 'health',
    label: 'Predict financial health',
    icon: '🩺',
    response: `**Financial Health Scorecard**

FinSight has run 200+ signal analysis across liquidity, solvency, efficiency, and growth dimensions.

| Dimension | Score | Signal |
|---|---|---|
| Liquidity | 84/100 | 🟢 Strong |
| Solvency | 71/100 | 🟡 Moderate |
| Profitability | 88/100 | 🟢 Strong |
| Efficiency | 76/100 | 🟡 Moderate |
| Growth Momentum | 91/100 | 🟢 Excellent |

**Overall Health Rating: 82/100 — Financially Healthy**

Key concern: Accounts receivable aging has increased by 12 days (DSO now at 47 days), suggesting mild collection pressure. Recommend monitoring working capital cycle in H1 2025.`,
  },
  {
    id: 'bankruptcy',
    label: 'Can company face bankruptcy?',
    icon: '⚠️',
    response: `**Bankruptcy Risk Analysis — Altman Z-Score Model**

FinSight has computed the Altman Z-Score using 5-factor weighted model across the uploaded statements.

**Computed Z-Score: 3.42**

| Zone | Z-Score Range | Status |
|---|---|---|
| 🔴 Distress Zone | < 1.81 | — |
| 🟡 Grey Zone | 1.81 – 2.99 | — |
| 🟢 Safe Zone | > 3.0 | ✅ Current |

**Component Breakdown:**
- Working Capital / Total Assets: **0.31** (healthy)
- Retained Earnings / Total Assets: **0.44** (strong)
- EBIT / Total Assets: **0.18** (moderate)
- Market Cap / Total Liabilities: **1.92** (comfortable)
- Revenue / Total Assets: **0.87** (efficient)

**FinSight Verdict:** 🟢 Low bankruptcy probability over 24-month horizon. No material distress signals detected.`,
  },
  {
    id: 'assets',
    label: 'Assets vs liabilities changes',
    icon: '⚖️',
    response: `**Assets vs. Liabilities — Period-over-Period Analysis**

**Total Assets Movement (FY2023 → FY2024):**
- Total Assets: $4.2B → **$4.71B** (+12.1%)
- Current Assets: $1.8B → **$2.1B** (+16.7%)
- Non-Current Assets: $2.4B → **$2.61B** (+8.75%)

**Total Liabilities Movement:**
- Total Liabilities: $2.1B → **$2.18B** (+3.8%)
- Current Liabilities: $860M → **$920M** (+7%)
- Long-term Debt: $1.24B → **$1.06B** (↓ 14.5%)

**Net Equity Change:** $2.1B → **$2.53B** (+20.5%) — shareholder value expanded meaningfully.

**Key Insight:** Asset growth is outpacing liability growth by a **3.2x ratio**, reflecting a deleveraging trend. The shift in long-term debt reduction combined with current asset expansion points to strong free cash flow generation and disciplined capital allocation.`,
  },
  {
    id: 'simple',
    label: 'Explain in simple language',
    icon: '💬',
    response: `**Plain-English Summary**

Think of this company like a well-run household that earns more than it spends, has money saved in the bank, and is slowly paying off its mortgage.

**What they earn:** Every year, the company brings in more money than the year before — about 8% more this year. That's like getting a raise at work.

**What they owe:** They have some debts (like a mortgage), but they're paying them down steadily. Their debts are shrinking while their savings are growing — a great sign.

**Can they pay their bills?** Yes, easily. For every $1 they owe short-term, they have $2.10 available — so no cash crunch risk.

**Are they profitable?** For every $100 they earn, they keep almost $30 as profit after all expenses. That's above average for their industry.

**Bottom line:** This looks like a financially responsible, growing company. Not flashy, but solid and getting stronger each year. 👍`,
  },
  {
    id: 'expert',
    label: 'What would a CA/CFA say?',
    icon: '🎓',
    response: `**CFA / CA Professional Perspective**

*As a Chartered Financial Analyst reviewing these statements, here's my professional assessment:*

**Income Statement View:** Revenue recognition appears conservative and consistent with IFRS 15 guidelines. The gross margin expansion (61% → 64%) is attributable to favorable product mix shift toward higher-margin SaaS tiers, not cost-cutting — a quality earnings signal.

**Balance Sheet View:** The intangible asset base ($340M) requires scrutiny — goodwill from the 2022 acquisition represents 72% of this figure. No impairment was recorded, but with rising discount rates, a sensitivity test on DCF assumptions is warranted.

**Cash Flow Quality:** Operating cash flow ($520M) exceeds reported net income ($380M) — a positive quality indicator, suggesting earnings are cash-backed and accruals are minimal (accrual ratio: -0.04).

**Red Flag Watch:** Related-party receivables increased by $18M with no disclosure update. This warrants inquiry at the next earnings call.

**Professional Opinion:** Investment grade fundamentals. Recommend initiating a position with a 5% portfolio weight, subject to management commentary on goodwill valuation at Q1 2025 earnings.`,
  },
  {
    id: 'flags',
    label: '10 red flags vs green flags',
    icon: '🚩',
    response: `**10 Red Flags vs. 10 Green Flags**

**🚩 RED FLAGS**
1. Related-party receivables increased $18M — undisclosed counterparty
2. DSO increased by 12 days → potential collection pressure
3. Goodwill ($245M) untested for impairment since 2022 acquisition
4. R&D capitalization rate spiked 22% — aggressive treatment possible
5. Tax rate dropped from 24% → 17% — one-time benefit, not recurring
6. Inventory days increased from 31 → 44 — potential demand softness
7. Off-balance-sheet operating leases: $88M not reflected in leverage ratios
8. Management turnover: CFO departed Q3 2024, interim still in place
9. Geographic revenue concentration: 71% from single market (US)
10. Free cash flow conversion below 80% for second consecutive year

**✅ GREEN FLAGS**
1. Revenue growth 8.3% YoY — above sector median (5.1%)
2. Operating margin expanded 760bps over 3 years
3. Long-term debt reduced by 18% — active deleveraging
4. Current ratio 2.1x — strong liquidity buffer
5. OCF exceeds net income — high earnings quality
6. Altman Z-Score 3.42 — firmly in safe zone
7. Share buybacks ($120M) — management confidence signal
8. Customer retention rate improved to 90.8% from 86%
9. Zero covenant breaches across all credit facilities
10. ESG disclosure score improved — growing institutional eligibility`,
  },
];

export default function FinGPT() {
  // Local state: active document selection
  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  // Local state: active prompt selection
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  return (
    <div className="min-h-screen bg-obsidian text-soft-white flex flex-col overflow-hidden">
      <FinGPTNavbar />

      {/* 3-column workspace */}
      <div className="flex flex-1 overflow-hidden pt-16 lg:pt-20">
        {/* LEFT: Document Sidebar */}
        <FinGPTSidebar
          documents={DOCUMENTS}
          activeDoc={activeDoc}
          onDocSelect={setActiveDoc}
        />

        {/* CENTER: AI Output */}
        <FinGPTOutput activePrompt={activePrompt} activeDoc={activeDoc} />

        {/* RIGHT: Prompt Engine */}
        <FinGPTPromptEngine
          prompts={PROMPTS}
          activePrompt={activePrompt}
          onPromptSelect={setActivePrompt}
        />
      </div>
    </div>
  );
}
