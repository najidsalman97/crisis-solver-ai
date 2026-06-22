import { o as __toESM } from "../_runtime.mjs";
import { D as isRedirect, _ as useRouter, g as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as analyzeReviews } from "./analyze.functions-C6FZidrO.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-arrow+[...].mjs";
import { t as supabase } from "./client-UxEtH3WB.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { i as Toaster$1, n as Input, r as Label, t as Button } from "./label-2QMmVB9m.mjs";
import { C as Activity, _ as Download, a as Sparkles, d as Mail, f as LoaderCircle, i as Ticket, l as MessageSquare, m as FileText, n as TriangleAlert, o as ShieldAlert, p as Globe, s as Settings, t as Upload, u as Megaphone, x as ArrowRight } from "../_libs/lucide-react.mjs";
import { t as require_jspdf_node_min } from "../_libs/jspdf.mjs";
import { a as Paragraph, i as Packer, n as File, o as TextRun, r as HeadingLevel, t as AlignmentType } from "../_libs/docx.mjs";
import { t as require_papaparse } from "../_libs/papaparse.mjs";
import { n as utils, t as readSync } from "../_libs/xlsx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DlpVxpWe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_jspdf_node_min = /* @__PURE__ */ __toESM(require_jspdf_node_min());
var import_papaparse = /* @__PURE__ */ __toESM(require_papaparse());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
function exportJiraCsv(analysis) {
	const csv = [[
		"Summary",
		"Issue Type",
		"Priority",
		"Description",
		"Acceptance Criteria"
	], ...analysis.jiraTickets.map((t) => [
		t.title,
		"Bug",
		t.priority,
		t.description.replace(/\n/g, " "),
		t.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join(" | ")
	])].map((r) => r.map((c) => `"${String(c).replace(/"/g, "\"\"")}"`).join(",")).join("\n");
	return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}
function exportPdf(analysis, title) {
	const doc = new import_jspdf_node_min.default({
		unit: "pt",
		format: "letter"
	});
	const margin = 48;
	const pageW = doc.internal.pageSize.getWidth();
	const pageH = doc.internal.pageSize.getHeight();
	const maxW = pageW - margin * 2;
	let y = margin;
	const ensure = (h) => {
		if (y + h > pageH - margin) {
			doc.addPage();
			y = margin;
		}
	};
	const heading = (text, size = 18) => {
		ensure(size + 12);
		doc.setFont("helvetica", "bold");
		doc.setFontSize(size);
		doc.setTextColor(20, 20, 20);
		doc.text(text, margin, y);
		y += size + 8;
	};
	const para = (text, size = 11) => {
		doc.setFont("helvetica", "normal");
		doc.setFontSize(size);
		doc.setTextColor(40, 40, 40);
		doc.splitTextToSize(text, maxW).forEach((line) => {
			ensure(size + 4);
			doc.text(line, margin, y);
			y += size + 4;
		});
		y += 6;
	};
	heading(title, 22);
	para(`Generated ${(/* @__PURE__ */ new Date()).toLocaleString()}`, 9);
	heading("Executive Summary", 14);
	para(analysis.executiveSummary);
	heading(`Severity: ${analysis.severity} (${analysis.severityScore}/100)`, 14);
	heading("Top Issues", 14);
	analysis.topIssues.forEach((issue, i) => {
		heading(`${i + 1}. ${issue.title} — ${issue.severity}`, 12);
		para(`Affected: ${issue.affectedCount}`);
		para(`Description: ${issue.description}`);
		para(`Root cause: ${issue.rootCause}`);
		para(`Recommended fix: ${issue.recommendedFix}`);
	});
	heading("Jira Tickets", 14);
	analysis.jiraTickets.forEach((t, i) => {
		heading(`${i + 1}. ${t.title} [${t.priority}]`, 12);
		para(t.description);
		para("Acceptance criteria:");
		t.acceptanceCriteria.forEach((c, j) => para(`  ${j + 1}. ${c}`));
	});
	heading("Customer Email", 14);
	para(analysis.customerEmail);
	heading("Status Page Update", 14);
	para(analysis.statusPageUpdate);
	heading("Social Media Update", 14);
	para(analysis.socialMediaUpdate);
	return doc.output("blob");
}
async function exportDocx(analysis, title) {
	const h = (text, level) => new Paragraph({
		heading: level,
		children: [new TextRun({ text })]
	});
	const p = (text) => new Paragraph({ children: [new TextRun({ text })] });
	const children = [
		new Paragraph({
			alignment: AlignmentType.LEFT,
			children: [new TextRun({
				text: title,
				bold: true,
				size: 44
			})]
		}),
		p(`Generated ${(/* @__PURE__ */ new Date()).toLocaleString()}`),
		h("Executive Summary", HeadingLevel.HEADING_1),
		p(analysis.executiveSummary),
		h(`Severity: ${analysis.severity} (${analysis.severityScore}/100)`, HeadingLevel.HEADING_2),
		h("Top Issues", HeadingLevel.HEADING_1)
	];
	analysis.topIssues.forEach((issue, i) => {
		children.push(h(`${i + 1}. ${issue.title} — ${issue.severity}`, HeadingLevel.HEADING_2));
		children.push(p(`Affected: ${issue.affectedCount}`));
		children.push(p(`Description: ${issue.description}`));
		children.push(p(`Root cause: ${issue.rootCause}`));
		children.push(p(`Recommended fix: ${issue.recommendedFix}`));
	});
	children.push(h("Jira Tickets", HeadingLevel.HEADING_1));
	analysis.jiraTickets.forEach((t, i) => {
		children.push(h(`${i + 1}. ${t.title} [${t.priority}]`, HeadingLevel.HEADING_2));
		children.push(p(t.description));
		children.push(p("Acceptance criteria:"));
		t.acceptanceCriteria.forEach((c, j) => children.push(p(`  ${j + 1}. ${c}`)));
	});
	children.push(h("Customer Email", HeadingLevel.HEADING_1));
	children.push(p(analysis.customerEmail));
	children.push(h("Status Page Update", HeadingLevel.HEADING_1));
	children.push(p(analysis.statusPageUpdate));
	children.push(h("Social Media Update", HeadingLevel.HEADING_1));
	children.push(p(analysis.socialMediaUpdate));
	const doc = new File({ sections: [{ children }] });
	return await Packer.toBlob(doc);
}
/**
* Intelligently detect and extract text column from CSV data
*/
function extractTextColumn(rows) {
	if (!rows.length) return "";
	const sample = rows[0];
	const cols = Object.keys(sample);
	return cols.find((c) => /review|comment|text|feedback|message|ticket|body|content|description/i.test(c)) || cols.find((c) => typeof sample[c] === "string" && (sample[c] || "").length > 20) || cols[0] || "";
}
/**
* Parse CSV file
*/
function parseCSV(file) {
	return new Promise((resolve, reject) => {
		import_papaparse.default.parse(file, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				try {
					const rows = results.data;
					const textCol = extractTextColumn(rows);
					const reviews = rows.map((r) => {
						return {
							text: (textCol ? r[textCol] : Object.values(r).join(" ")).trim() || "",
							date: r.date || r.created_at || r.timestamp || void 0,
							source: "csv"
						};
					}).filter((r) => r.text.length > 3);
					resolve({
						reviews,
						rawReviews: reviews.map((r) => r.text)
					});
				} catch (err) {
					reject(err);
				}
			},
			error: (err) => reject(/* @__PURE__ */ new Error(`CSV parse error: ${err.message}`))
		});
	});
}
/**
* Parse Excel file (XLSX/XLS)
*/
function parseExcel(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = e.target?.result;
				const workbook = readSync(data, { type: "array" });
				const sheetName = workbook.SheetNames[0];
				const worksheet = workbook.Sheets[sheetName];
				const rows = utils.sheet_to_json(worksheet);
				if (!rows.length) {
					resolve({
						reviews: [],
						rawReviews: []
					});
					return;
				}
				const textCol = extractTextColumn(rows);
				const reviews = rows.map((r) => {
					return {
						text: (textCol ? r[textCol] : Object.values(r).join(" ")).trim() || "",
						date: r.date || r.created_at || r.timestamp || void 0,
						source: "excel"
					};
				}).filter((r) => r.text.length > 3);
				resolve({
					reviews,
					rawReviews: reviews.map((r) => r.text)
				});
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Failed to read file"));
		reader.readAsArrayBuffer(file);
	});
}
/**
* Parse JSON file
*/
function parseJSON(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const text = e.target?.result;
				let data = JSON.parse(text);
				if (!Array.isArray(data)) {
					const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
					if (arrayKey) data = data[arrayKey];
					else data = [data];
				}
				const reviews = data.map((item) => {
					if (typeof item === "string") return {
						text: item,
						date: void 0,
						source: "json"
					};
					if (typeof item === "object" && item !== null) {
						const obj = item;
						const text = obj.text || obj.review || obj.comment || obj.content || JSON.stringify(obj);
						return {
							text: String(text).trim(),
							date: obj.date || obj.created_at || obj.timestamp ? String(obj.date || obj.created_at || obj.timestamp) : void 0,
							source: "json"
						};
					}
					return null;
				}).filter((r) => r !== null && r.text.length > 3);
				resolve({
					reviews,
					rawReviews: reviews.map((r) => r.text)
				});
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Failed to read file"));
		reader.readAsText(file);
	});
}
/**
* Parse TXT file (one review per line or paragraph)
*/
function parseTXT(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const text = e.target?.result;
				const separator = text.includes("\n\n") ? "\n\n" : "\n";
				const reviews = text.split(separator).map((l) => l.trim()).filter((l) => l.length > 3).map((text) => ({
					text,
					date: void 0,
					source: "txt"
				}));
				resolve({
					reviews,
					rawReviews: reviews.map((r) => r.text)
				});
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => reject(/* @__PURE__ */ new Error("Failed to read file"));
		reader.readAsText(file);
	});
}
/**
* Auto-detect file type and parse
*/
async function parseFile(file) {
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	if (name.endsWith(".csv") || type === "text/csv") return parseCSV(file);
	if (name.endsWith(".xlsx") || type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return parseExcel(file);
	if (name.endsWith(".xls") || type === "application/vnd.ms-excel") return parseExcel(file);
	if (name.endsWith(".json") || type === "application/json") return parseJSON(file);
	if (name.endsWith(".txt") || type === "text/plain") return parseTXT(file);
	try {
		return await parseCSV(file);
	} catch {
		try {
			return await parseJSON(file);
		} catch {
			return parseTXT(file);
		}
	}
}
/**
* Filter reviews by date range
*/
function filterByDateRange(reviews, startDate, endDate) {
	if (!startDate && !endDate) return reviews;
	return reviews.filter((r) => {
		if (!r.date) return true;
		try {
			const reviewDate = new Date(r.date);
			if (startDate && reviewDate < startDate) return false;
			if (endDate && reviewDate > endDate) return false;
			return true;
		} catch {
			return true;
		}
	});
}
function severityColor(s) {
	switch (s) {
		case "Critical": return "text-critical";
		case "High": return "text-primary";
		case "Medium": return "text-warning";
		default: return "text-success";
	}
}
function severityBg(s) {
	switch (s) {
		case "Critical": return "bg-[oklch(0.62_0.24_25/0.15)] border-[oklch(0.62_0.24_25/0.4)]";
		case "High": return "bg-[oklch(0.72_0.18_28/0.15)] border-[oklch(0.72_0.18_28/0.4)]";
		case "Medium": return "bg-[oklch(0.78_0.15_75/0.12)] border-[oklch(0.78_0.15_75/0.35)]";
		default: return "bg-[oklch(0.70_0.16_155/0.12)] border-[oklch(0.70_0.16_155/0.35)]";
	}
}
function Dashboard() {
	const navigate = useNavigate();
	const analyze = useServerFn(analyzeReviews);
	const [allReviews, setAllReviews] = (0, import_react.useState)([]);
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [analysis, setAnalysis] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [startDate, setStartDate] = (0, import_react.useState)("");
	const [endDate, setEndDate] = (0, import_react.useState)("");
	const fileRef = (0, import_react.useRef)(null);
	const filteredReviews = (0, import_react.useMemo)(() => {
		return filterByDateRange(allReviews, startDate ? new Date(startDate) : void 0, endDate ? new Date(endDate) : void 0).map((r) => r.text);
	}, [
		allReviews,
		startDate,
		endDate
	]);
	const reportTitle = (0, import_react.useMemo)(() => fileName ? `Crisis Report — ${fileName.replace(/\.[^.]+$/, "")}` : "Crisis Report", [fileName]);
	async function handleFile(file) {
		setFileName(file.name);
		setAnalysis(null);
		try {
			const { reviews, rawReviews } = await parseFile(file);
			setAllReviews(reviews);
			toast.success(`Loaded ${rawReviews.length} reviews from ${file.name}`);
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : "Failed to parse file");
		}
	}
	function loadSample() {
		setAllReviews([
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
			"Billing page shows the wrong invoice total."
		].map((text) => ({
			text,
			date: void 0,
			source: "sample"
		})));
		setFileName("sample-reviews.csv");
		setAnalysis(null);
		toast.success("Loaded 15 sample reviews");
	}
	async function runAnalysis() {
		if (filteredReviews.length === 0) {
			toast.error("No reviews to analyze");
			return;
		}
		setLoading(true);
		setAnalysis(null);
		try {
			const settings = JSON.parse(localStorage.getItem("crisisroom-ai-settings") || "{}");
			const headers = {};
			if (settings.geminiKey) headers["x-gemini-key"] = settings.geminiKey;
			if (settings.openaiKey) headers["x-openai-key"] = settings.openaiKey;
			if (settings.openrouterKey) headers["x-openrouter-key"] = settings.openrouterKey;
			if (settings.provider) headers["x-ai-provider"] = settings.provider;
			const originalFetch = window.fetch;
			window.fetch = async (input, init) => {
				return originalFetch(input, {
					...init,
					headers: {
						...headers,
						...init?.headers || {}
					}
				});
			};
			try {
				const result = await analyze({ data: { reviews: filteredReviews } });
				setAnalysis(result);
				supabase.from("reports").insert({
					title: reportTitle,
					total_reviews: filteredReviews.length,
					severity: result.severity,
					data: result
				}).then(({ error }) => {
					if (error) console.warn("Save failed", error);
				});
				toast.success("Crisis report generated");
			} finally {
				window.fetch = originalFetch;
			}
		} catch (e) {
			console.error(e);
			toast.error(e instanceof Error ? e.message : "Analysis failed");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
				theme: "dark",
				position: "top-right",
				richColors: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, { onSettingsClick: () => navigate({ to: "/settings" }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-24",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-10 grid gap-6 lg:grid-cols-[1fr_2fr]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UploadCard, {
							fileRef,
							fileName,
							reviewsCount: filteredReviews.length,
							totalReviewsCount: allReviews.length,
							startDate,
							endDate,
							onStartDateChange: setStartDate,
							onEndDateChange: setEndDate,
							loading,
							onPickFile: () => fileRef.current?.click(),
							onFile: handleFile,
							onLoadSample: loadSample,
							onAnalyze: runAnalysis
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricsPanel, {
							reviewsCount: filteredReviews.length,
							analysis,
							loading
						})]
					}),
					loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, {}),
					analysis && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBar, {
							onPdf: () => downloadBlob(exportPdf(analysis, reportTitle), `${reportTitle}.pdf`),
							onDocx: async () => downloadBlob(await exportDocx(analysis, reportTitle), `${reportTitle}.docx`),
							onJira: () => downloadBlob(exportJiraCsv(analysis), `${reportTitle}-jira.csv`)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExecutiveSummary, { analysis }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopIssues, { analysis }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(JiraTickets, { analysis }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Communications, { analysis })
					] }),
					!analysis && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function Header({ onSettingsClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-30 backdrop-blur-xl bg-[oklch(0.16_0.02_260/0.7)] border-b border-border",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative h-9 w-9 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center glow-ember",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "leading-tight",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-display text-base font-semibold tracking-tight",
						children: ["CrisisRoom ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "AI"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground",
						children: "Incident Command Console"
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden sm:flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "chip",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-1.5 w-1.5 rounded-full bg-success animate-pulse" }), "AI · Online"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: onSettingsClick,
					title: "Settings",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "h-4 w-4" })
				})]
			})]
		})
	});
}
function Hero() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pt-10 sm:pt-14",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-3.5 w-3.5 text-primary" }), "AI-Powered Crisis Response"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
				className: "font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight max-w-4xl",
				children: [
					"From ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary",
						children: "customer chaos"
					}),
					" to a crisis-ready plan — in minutes."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground",
				children: "Upload reviews, tickets, or complaints. CrisisRoom AI clusters issues, assigns severity, drafts Jira tickets, and writes the email, status page, and social post for you."
			})
		]
	});
}
function UploadCard({ fileRef, fileName, reviewsCount, totalReviewsCount, startDate, endDate, onStartDateChange, onEndDateChange, loading, onPickFile, onFile, onLoadSample, onAnalyze }) {
	const [drag, setDrag] = (0, import_react.useState)(false);
	const showFiltered = totalReviewsCount > 0 && totalReviewsCount !== reviewsCount;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-display text-lg font-semibold",
					children: "Intake"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "chip text-muted-foreground",
					children: "CSV · XLSX · JSON · TXT"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				onDragOver: (e) => {
					e.preventDefault();
					setDrag(true);
				},
				onDragLeave: () => setDrag(false),
				onDrop: (e) => {
					e.preventDefault();
					setDrag(false);
					const f = e.dataTransfer.files?.[0];
					if (f) onFile(f);
				},
				className: `group relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 cursor-pointer transition-all ${drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-white/[0.02]"}`,
				onClick: onPickFile,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-12 w-12 rounded-full bg-primary/10 border border-primary/30 grid place-items-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "h-5 w-5 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium",
							children: "Drop file here or click to upload"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground mt-1",
							children: "CSV, XLSX, JSON, or TXT with reviews"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: fileRef,
						type: "file",
						accept: ".csv,.xlsx,.xls,.json,.txt,text/csv,application/json,text/plain",
						className: "hidden",
						onChange: (e) => {
							const f = e.target.files?.[0];
							if (f) onFile(f);
						}
					})
				]
			}),
			fileName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex items-center justify-between rounded-lg border border-border bg-white/[0.03] px-3 py-2.5 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4 text-accent shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate font-mono text-xs",
						children: fileName
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "chip text-muted-foreground",
					children: [
						totalReviewsCount,
						" ",
						showFiltered ? `→ ${reviewsCount}` : "",
						"rows"
					]
				})]
			}),
			totalReviewsCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
						children: "Date Filter (Optional)"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "start-date",
							className: "text-xs mb-1 block",
							children: "Start Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "start-date",
							type: "date",
							value: startDate,
							onChange: (e) => onStartDateChange(e.target.value),
							className: "h-8 text-xs"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "end-date",
							className: "text-xs mb-1 block",
							children: "End Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "end-date",
							type: "date",
							value: endDate,
							onChange: (e) => onEndDateChange(e.target.value),
							className: "h-8 text-xs"
						})] })]
					}),
					showFiltered && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-muted-foreground",
						children: [
							reviewsCount,
							" of ",
							totalReviewsCount,
							" reviews match date range"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onAnalyze,
					disabled: loading || reviewsCount === 0,
					className: "group inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-4 py-3 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed glow-ember",
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), " Analyzing…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Run Crisis Analysis", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4 transition-transform group-hover:translate-x-0.5" })] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onLoadSample,
					className: "text-xs text-muted-foreground hover:text-foreground transition-colors",
					children: "or load sample data →"
				})]
			})
		]
	});
}
function MetricsPanel({ reviewsCount, analysis, loading }) {
	const issues = analysis?.topIssues.length ?? 0;
	const score = analysis?.severityScore ?? 0;
	const severity = analysis?.severity ?? "—";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid grid-cols-2 lg:grid-cols-4 gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
				label: "Total Reviews",
				value: reviewsCount.toLocaleString(),
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "h-4 w-4" }),
				accent: "text-accent"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
				label: "Top Issues",
				value: loading ? "…" : String(issues),
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }),
				accent: "text-warning"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MetricCard, {
				label: "Severity",
				value: severity,
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-4 w-4" }),
				accent: severityColor(severity)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreCard, {
				score,
				severity,
				loading,
				hasData: !!analysis
			})
		]
	});
}
function MetricCard({ label, value, icon, accent }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `flex items-center gap-2 text-xs uppercase tracking-wider ${accent}`,
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 font-display text-3xl font-semibold tabular-nums",
			children: value
		})]
	});
}
function ScoreCard({ score, severity, loading, hasData }) {
	const pct = Math.max(0, Math.min(100, score));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "h-4 w-4" }), "Severity Score"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex items-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-display text-3xl font-semibold tabular-nums",
					children: loading ? "…" : hasData ? pct : 0
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground mb-1.5",
					children: "/ 100"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `h-full rounded-full transition-all duration-700 ${severity === "Critical" ? "bg-critical" : severity === "High" ? "bg-primary" : severity === "Medium" ? "bg-warning" : "bg-success"}`,
					style: { width: `${hasData ? pct : 0}%` }
				})
			})
		]
	});
}
function LoadingState() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface mt-8 p-8 flex flex-col items-center justify-center gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-8 w-8 text-primary animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-display text-lg font-semibold",
				children: "Gemini is in the war room"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Clustering issues, ranking severity, drafting tickets and comms…"
			})]
		})]
	});
}
function EmptyState() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-10 surface p-10 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto h-12 w-12 rounded-full bg-accent/10 border border-accent/30 grid place-items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "h-5 w-5 text-accent" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-4 font-display text-xl font-semibold",
				children: "Your crisis report will appear here"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground max-w-md mx-auto",
				children: "Upload a CSV of customer reviews or load sample data, then run analysis. You'll get an executive summary, severity score, ranked issues, ready-to-ship Jira tickets, and customer communications."
			})
		]
	});
}
function ExportBar({ onPdf, onDocx, onJira }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-10 surface p-4 flex flex-wrap items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-4 w-4 text-accent" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: "Export Report"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground hidden sm:inline",
					children: "· share with leadership and engineering"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBtn, {
					onClick: onPdf,
					label: "PDF Report"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBtn, {
					onClick: onDocx,
					label: "DOCX Report"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBtn, {
					onClick: onJira,
					label: "Jira CSV",
					primary: true
				})
			]
		})]
	});
}
function ExportBtn({ onClick, label, primary }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => onClick(),
		className: `inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${primary ? "bg-primary text-primary-foreground hover:brightness-110 glow-ember" : "bg-white/5 border border-border hover:bg-white/10"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "h-3.5 w-3.5" }), label]
	});
}
function ExecutiveSummary({ analysis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8 surface p-6 sm:p-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between flex-wrap gap-3 mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-semibold",
				children: "Executive Summary"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `chip ${severityBg(analysis.severity)} ${severityColor(analysis.severity)}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "h-3.5 w-3.5" }),
					analysis.severity,
					" · ",
					analysis.severityScore,
					"/100"
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-base leading-relaxed text-foreground/90",
			children: analysis.executiveSummary
		})]
	});
}
function TopIssues({ analysis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "h-4 w-4" }),
			title: "Top Issues"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid gap-4 md:grid-cols-2",
			children: analysis.topIssues.map((issue, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3 mb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-display text-lg font-semibold leading-snug",
							children: issue.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `chip shrink-0 ${severityBg(issue.severity)} ${severityColor(issue.severity)}`,
							children: issue.severity
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: issue.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: issue.affectedCount
						}), " affected mentions"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 rounded-lg border border-border bg-white/[0.02] p-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs uppercase tracking-wider text-warning mb-1",
							children: "Root cause"
						}), issue.rootCause]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 rounded-lg border border-border bg-white/[0.02] p-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs uppercase tracking-wider text-success mb-1",
							children: "Recommended fix"
						}), issue.recommendedFix]
					})
				]
			}, i))
		})]
	});
}
function JiraTickets({ analysis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ticket, { className: "h-4 w-4" }),
			title: "Jira-Ready Tickets"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: analysis.jiraTickets.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "surface p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-3 flex-wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-mono text-xs text-muted-foreground",
								children: ["CRR-", (i + 1).toString().padStart(3, "0")]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-display text-base font-semibold truncate",
								children: t.title
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `chip ${severityBg(t.priority)} ${severityColor(t.priority)}`,
							children: t.priority
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-muted-foreground",
						children: t.description
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 rounded-lg border border-border bg-white/[0.02] p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs uppercase tracking-wider text-accent mb-2",
							children: "Acceptance Criteria"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1 text-sm",
							children: t.acceptanceCriteria.map((c, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [j + 1, "."]
								}), c]
							}, j))
						})]
					})
				]
			}, i))
		})]
	});
}
function Communications({ analysis }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHead, {
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-4 w-4" }),
			title: "Communications"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 md:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommCard, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4" }),
					title: "Customer Email",
					body: analysis.customerEmail,
					color: "text-accent"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommCard, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "h-4 w-4" }),
					title: "Status Page",
					body: analysis.statusPageUpdate,
					color: "text-warning"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommCard, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Megaphone, { className: "h-4 w-4" }),
					title: "Social Media",
					body: analysis.socialMediaUpdate,
					color: "text-primary"
				})
			]
		})]
	});
}
function CommCard({ icon, title, body, color }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface p-5 flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: `flex items-center gap-2 text-xs uppercase tracking-wider ${color}`,
				children: [icon, title]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm whitespace-pre-wrap text-foreground/90 flex-1",
				children: body
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => {
					navigator.clipboard.writeText(body);
					toast.success(`${title} copied`);
				},
				className: "mt-4 self-start text-xs text-muted-foreground hover:text-foreground transition-colors",
				children: "Copy to clipboard →"
			})
		]
	});
}
function SectionHead({ icon, title }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 mb-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-7 w-7 rounded-md bg-white/5 border border-border grid place-items-center text-primary",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-semibold",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" })
		]
	});
}
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "border-t border-border mt-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				"© ",
				(/* @__PURE__ */ new Date()).getFullYear(),
				" CrisisRoom AI · Built for product crisis teams"
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono",
				children: "Powered by Gemini"
			})]
		})
	});
}
//#endregion
export { Dashboard as component };
