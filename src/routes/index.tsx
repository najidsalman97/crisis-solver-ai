import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Download,
  AlertTriangle,
  Activity,
  MessageSquare,
  Ticket,
  Mail,
  Globe,
  Megaphone,
  Sparkles,
  ShieldAlert,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { analyzeReviews, type Analysis } from "@/lib/analyze.functions";
import { exportPdf, exportDocx, exportJiraCsv, downloadBlob } from "@/lib/exporters";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CrisisRoom AI — AI crisis response for product teams" },
      {
        name: "description",
        content:
          "Upload customer reviews. Get an executive crisis report, Jira tickets, and customer comms in minutes.",
      },
    ],
  }),
  component: Dashboard,
});

const SAMPLE_REVIEWS = [
  "App crashes every time I try to upload a profile photo on iOS 17. Lost my work twice today.",
  "Login with Google has been broken since the last update — keeps redirecting in a loop.",
  "Charged twice for the same subscription. Support hasn't responded in 4 days.",
  "Notifications are 6 hours late. Missed an important alert from my team.",
  "Dark mode is gorgeous, love the redesign!",
  "Export to PDF produces blank pages on documents over 10 MB.",
  "App is so slow on Android, takes 30 seconds to open a chat.",
  "Two-factor authentication codes never arrive via SMS.",
  "Calendar sync deleted all my events overnight. This is a disaster.",
  "Search returns no results even for items I clearly have.",
  "Crashes on launch after the 4.2 update. Reinstalled twice, no fix.",
  "I keep getting logged out every few hours, super annoying.",
  "Great customer support! Resolved my issue in minutes.",
  "Push notifications never work on Pixel 8.",
  "Billing page shows the wrong invoice total.",
];

function severityColor(s: string) {
  switch (s) {
    case "Critical":
      return "text-critical";
    case "High":
      return "text-primary";
    case "Medium":
      return "text-warning";
    default:
      return "text-success";
  }
}
function severityBg(s: string) {
  switch (s) {
    case "Critical":
      return "bg-[oklch(0.62_0.24_25/0.15)] border-[oklch(0.62_0.24_25/0.4)]";
    case "High":
      return "bg-[oklch(0.72_0.18_28/0.15)] border-[oklch(0.72_0.18_28/0.4)]";
    case "Medium":
      return "bg-[oklch(0.78_0.15_75/0.12)] border-[oklch(0.78_0.15_75/0.35)]";
    default:
      return "bg-[oklch(0.70_0.16_155/0.12)] border-[oklch(0.70_0.16_155/0.35)]";
  }
}

function Dashboard() {
  const analyze = useServerFn(analyzeReviews);
  const [reviews, setReviews] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reportTitle = useMemo(
    () =>
      fileName
        ? `Crisis Report — ${fileName.replace(/\.[^.]+$/, "")}`
        : "Crisis Report",
    [fileName]
  );

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        // Pick the most "text-like" column
        const sample = rows[0] || {};
        const cols = Object.keys(sample);
        const textCol =
          cols.find((c) => /review|comment|text|feedback|message|ticket|body/i.test(c)) ||
          cols.find((c) => typeof sample[c] === "string" && (sample[c] || "").length > 20) ||
          cols[0];
        const extracted = rows
          .map((r) => (textCol ? r[textCol] : Object.values(r).join(" ")))
          .filter((x): x is string => !!x && x.trim().length > 3);
        setReviews(extracted);
        toast.success(`Loaded ${extracted.length} reviews from ${file.name}`);
      },
      error: (err) => toast.error(`CSV error: ${err.message}`),
    });
  }

  function loadSample() {
    setReviews(SAMPLE_REVIEWS);
    setFileName("sample-reviews.csv");
    toast.success("Loaded 15 sample reviews");
  }

  async function runAnalysis() {
    if (reviews.length === 0) {
      toast.error("Upload a CSV or load the sample first");
      return;
    }
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyze({ data: { reviews } });
      setAnalysis(result);
      // Persist (best-effort, don't block)
      supabase
        .from("reports")
        .insert({
          title: reportTitle,
          total_reviews: reviews.length,
          severity: result.severity,
          data: result as never,
        })
        .then(({ error }) => {
          if (error) console.warn("Save failed", error);
        });
      toast.success("Crisis report generated");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-right" richColors />
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <Hero />

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <UploadCard
            fileRef={fileRef}
            fileName={fileName}
            reviewsCount={reviews.length}
            loading={loading}
            onPickFile={() => fileRef.current?.click()}
            onFile={handleFile}
            onLoadSample={loadSample}
            onAnalyze={runAnalysis}
          />
          <MetricsPanel reviewsCount={reviews.length} analysis={analysis} loading={loading} />
        </section>

        {loading && <LoadingState />}

        {analysis && (
          <>
            <ExportBar
              onPdf={() => downloadBlob(exportPdf(analysis, reportTitle), `${reportTitle}.pdf`)}
              onDocx={async () =>
                downloadBlob(await exportDocx(analysis, reportTitle), `${reportTitle}.docx`)
              }
              onJira={() => downloadBlob(exportJiraCsv(analysis), `${reportTitle}-jira.csv`)}
            />
            <ExecutiveSummary analysis={analysis} />
            <TopIssues analysis={analysis} />
            <JiraTickets analysis={analysis} />
            <Communications analysis={analysis} />
          </>
        )}

        {!analysis && !loading && <EmptyState />}
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-[oklch(0.16_0.02_260/0.7)] border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center glow-ember">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-base font-semibold tracking-tight">
              CrisisRoom <span className="text-primary">AI</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Incident Command Console
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Gemini · Online
          </span>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="pt-10 sm:pt-14">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        AI-Powered Crisis Response
      </div>
      <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-4xl">
        From <span className="text-primary">customer chaos</span> to a
        crisis-ready plan — in minutes.
      </h1>
      <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
        Upload reviews, tickets, or complaints. CrisisRoom AI clusters issues,
        assigns severity, drafts Jira tickets, and writes the email, status page, and
        social post for you.
      </p>
    </div>
  );
}

function UploadCard({
  fileRef,
  fileName,
  reviewsCount,
  loading,
  onPickFile,
  onFile,
  onLoadSample,
  onAnalyze,
}: {
  fileRef: React.RefObject<HTMLInputElement | null>;
  fileName: string;
  reviewsCount: number;
  loading: boolean;
  onPickFile: () => void;
  onFile: (f: File) => void;
  onLoadSample: () => void;
  onAnalyze: () => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div className="surface p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Intake</h3>
        <span className="chip text-muted-foreground">CSV · Reviews · Tickets</span>
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all ${
          drag
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-white/[0.02]"
        }`}
        onClick={onPickFile}
      >
        <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 grid place-items-center">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div className="text-center">
          <div className="font-medium">Drop CSV here or click to upload</div>
          <div className="text-xs text-muted-foreground mt-1">
            Any CSV with a text/review/comment column
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>

      {fileName && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-white/[0.03] px-3 py-2.5 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 text-accent shrink-0" />
            <span className="truncate font-mono text-xs">{fileName}</span>
          </div>
          <span className="chip text-muted-foreground">{reviewsCount} rows</span>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={onAnalyze}
          disabled={loading || reviewsCount === 0}
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-3 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-ember"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
            </>
          ) : (
            <>
              Run Crisis Analysis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
        <button
          onClick={onLoadSample}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          or load sample data →
        </button>
      </div>
    </div>
  );
}

function MetricsPanel({
  reviewsCount,
  analysis,
  loading,
}: {
  reviewsCount: number;
  analysis: Analysis | null;
  loading: boolean;
}) {
  const issues = analysis?.topIssues.length ?? 0;
  const score = analysis?.severityScore ?? 0;
  const severity = analysis?.severity ?? "—";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Reviews"
        value={reviewsCount.toLocaleString()}
        icon={<MessageSquare className="h-4 w-4" />}
        accent="text-accent"
      />
      <MetricCard
        label="Top Issues"
        value={loading ? "…" : String(issues)}
        icon={<AlertTriangle className="h-4 w-4" />}
        accent="text-warning"
      />
      <MetricCard
        label="Severity"
        value={severity}
        icon={<ShieldAlert className="h-4 w-4" />}
        accent={severityColor(severity)}
      />
      <ScoreCard score={score} severity={severity} loading={loading} hasData={!!analysis} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="surface p-5">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${accent}`}>
        {icon}
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ScoreCard({
  score,
  severity,
  loading,
  hasData,
}: {
  score: number;
  severity: string;
  loading: boolean;
  hasData: boolean;
}) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="surface p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Activity className="h-4 w-4" />
        Severity Score
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="font-display text-3xl font-semibold tabular-nums">
          {loading ? "…" : hasData ? pct : 0}
        </div>
        <div className="text-xs text-muted-foreground mb-1.5">/ 100</div>
      </div>
      <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            severity === "Critical"
              ? "bg-critical"
              : severity === "High"
              ? "bg-primary"
              : severity === "Medium"
              ? "bg-warning"
              : "bg-success"
          }`}
          style={{ width: `${hasData ? pct : 0}%` }}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="surface mt-8 p-8 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <div className="text-center">
        <div className="font-display text-lg font-semibold">Gemini is in the war room</div>
        <div className="text-sm text-muted-foreground mt-1">
          Clustering issues, ranking severity, drafting tickets and comms…
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 surface p-10 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 border border-accent/30 grid place-items-center">
        <Sparkles className="h-5 w-5 text-accent" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">
        Your crisis report will appear here
      </h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
        Upload a CSV of customer reviews or load sample data, then run analysis.
        You'll get an executive summary, severity score, ranked issues, ready-to-ship
        Jira tickets, and customer communications.
      </p>
    </div>
  );
}

function ExportBar({
  onPdf,
  onDocx,
  onJira,
}: {
  onPdf: () => void;
  onDocx: () => void | Promise<void>;
  onJira: () => void;
}) {
  return (
    <div className="mt-10 surface p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <Download className="h-4 w-4 text-accent" />
        <span className="font-medium">Export Report</span>
        <span className="text-muted-foreground hidden sm:inline">
          · share with leadership and engineering
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <ExportBtn onClick={onPdf} label="PDF Report" />
        <ExportBtn onClick={onDocx} label="DOCX Report" />
        <ExportBtn onClick={onJira} label="Jira CSV" primary />
      </div>
    </div>
  );
}
function ExportBtn({
  onClick,
  label,
  primary,
}: {
  onClick: () => void | Promise<void>;
  label: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={() => onClick()}
      className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
        primary
          ? "bg-primary text-primary-foreground hover:brightness-110 glow-ember"
          : "bg-white/5 border border-border hover:bg-white/10"
      }`}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ExecutiveSummary({ analysis }: { analysis: Analysis }) {
  return (
    <section className="mt-8 surface p-6 sm:p-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-display text-2xl font-semibold">Executive Summary</h2>
        <span
          className={`chip ${severityBg(analysis.severity)} ${severityColor(
            analysis.severity
          )}`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          {analysis.severity} · {analysis.severityScore}/100
        </span>
      </div>
      <p className="text-base leading-relaxed text-foreground/90">
        {analysis.executiveSummary}
      </p>
    </section>
  );
}

function TopIssues({ analysis }: { analysis: Analysis }) {
  return (
    <section className="mt-8">
      <SectionHead icon={<AlertTriangle className="h-4 w-4" />} title="Top Issues" />
      <div className="grid gap-4 md:grid-cols-2">
        {analysis.topIssues.map((issue, i) => (
          <div key={i} className="surface p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-display text-lg font-semibold leading-snug">
                {issue.title}
              </h3>
              <span
                className={`chip shrink-0 ${severityBg(issue.severity)} ${severityColor(
                  issue.severity
                )}`}
              >
                {issue.severity}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="font-mono">{issue.affectedCount}</span> affected mentions
            </div>
            <div className="mt-4 rounded-lg border border-border bg-white/[0.02] p-3 text-sm">
              <div className="text-xs uppercase tracking-wider text-warning mb-1">
                Root cause
              </div>
              {issue.rootCause}
            </div>
            <div className="mt-2 rounded-lg border border-border bg-white/[0.02] p-3 text-sm">
              <div className="text-xs uppercase tracking-wider text-success mb-1">
                Recommended fix
              </div>
              {issue.recommendedFix}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JiraTickets({ analysis }: { analysis: Analysis }) {
  return (
    <section className="mt-10">
      <SectionHead icon={<Ticket className="h-4 w-4" />} title="Jira-Ready Tickets" />
      <div className="space-y-3">
        {analysis.jiraTickets.map((t, i) => (
          <div key={i} className="surface p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs text-muted-foreground">
                  CRR-{(i + 1).toString().padStart(3, "0")}
                </span>
                <h3 className="font-display text-base font-semibold truncate">
                  {t.title}
                </h3>
              </div>
              <span
                className={`chip ${severityBg(t.priority)} ${severityColor(t.priority)}`}
              >
                {t.priority}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.description}</p>
            <div className="mt-3 rounded-lg border border-border bg-white/[0.02] p-3">
              <div className="text-xs uppercase tracking-wider text-accent mb-2">
                Acceptance Criteria
              </div>
              <ul className="space-y-1 text-sm">
                {t.acceptanceCriteria.map((c, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-muted-foreground">{j + 1}.</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Communications({ analysis }: { analysis: Analysis }) {
  return (
    <section className="mt-10">
      <SectionHead icon={<Megaphone className="h-4 w-4" />} title="Communications" />
      <div className="grid gap-4 md:grid-cols-3">
        <CommCard
          icon={<Mail className="h-4 w-4" />}
          title="Customer Email"
          body={analysis.customerEmail}
          color="text-accent"
        />
        <CommCard
          icon={<Globe className="h-4 w-4" />}
          title="Status Page"
          body={analysis.statusPageUpdate}
          color="text-warning"
        />
        <CommCard
          icon={<Megaphone className="h-4 w-4" />}
          title="Social Media"
          body={analysis.socialMediaUpdate}
          color="text-primary"
        />
      </div>
    </section>
  );
}

function CommCard({
  icon,
  title,
  body,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <div className="surface p-5 flex flex-col">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${color}`}>
        {icon}
        {title}
      </div>
      <p className="mt-3 text-sm whitespace-pre-wrap text-foreground/90 flex-1">{body}</p>
      <button
        onClick={() => {
          navigator.clipboard.writeText(body);
          toast.success(`${title} copied`);
        }}
        className="mt-4 self-start text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Copy to clipboard →
      </button>
    </div>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-7 w-7 rounded-md bg-white/5 border border-border grid place-items-center text-primary">
        {icon}
      </div>
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} CrisisRoom AI · Built for product crisis teams</div>
        <div className="font-mono">Powered by Gemini</div>
      </div>
    </footer>
  );
}
