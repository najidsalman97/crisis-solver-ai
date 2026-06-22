// Place all client-side utilities for generating documents.
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { Analysis } from "./analyze.functions";

export function exportJiraCsv(analysis: Analysis): Blob {
  const rows = [
    ["Summary", "Issue Type", "Priority", "Description", "Acceptance Criteria"],
    ...analysis.jiraTickets.map((t) => [
      t.title,
      "Bug",
      t.priority,
      t.description.replace(/\n/g, " "),
      t.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join(" | "),
    ]),
  ];
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPdf(analysis: Analysis, title: string): Blob {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensure = (h: number) => {
    if (y + h > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string, size = 18) => {
    ensure(size + 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(20, 20, 20);
    doc.text(text, margin, y);
    y += size + 8;
  };
  const para = (text: string, size = 11) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(text, maxW);
    lines.forEach((line: string) => {
      ensure(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    });
    y += 6;
  };

  heading(title, 22);
  para(`Generated ${new Date().toLocaleString()}`, 9);
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

export async function exportDocx(analysis: Analysis, title: string): Promise<Blob> {
  const h = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
    new Paragraph({ heading: level, children: [new TextRun({ text })] });
  const p = (text: string) =>
    new Paragraph({ children: [new TextRun({ text })] });

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: title, bold: true, size: 44 })],
    }),
    p(`Generated ${new Date().toLocaleString()}`),
    h("Executive Summary", HeadingLevel.HEADING_1),
    p(analysis.executiveSummary),
    h(`Severity: ${analysis.severity} (${analysis.severityScore}/100)`, HeadingLevel.HEADING_2),
    h("Top Issues", HeadingLevel.HEADING_1),
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

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBlob(doc);
  return buffer;
}
