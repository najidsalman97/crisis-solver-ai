import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ReviewItem {
  text: string;
  date?: string;
  source?: string;
}

export interface ParseResult {
  reviews: ReviewItem[];
  rawReviews: string[];
}

/**
 * Intelligently detect and extract text column from CSV data
 */
function extractTextColumn(rows: Record<string, string>[]): string {
  if (!rows.length) return "";

  const sample = rows[0];
  const cols = Object.keys(sample);

  // Priority: look for common review/feedback column names
  const textCol =
    cols.find((c) => /review|comment|text|feedback|message|ticket|body|content|description/i.test(c)) ||
    // Then: find the longest string column (likely review text)
    cols.find((c) => typeof sample[c] === "string" && (sample[c] || "").length > 20) ||
    // Finally: use first column
    cols[0];

  return textCol || "";
}

/**
 * Parse CSV file
 */
export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data;
          const textCol = extractTextColumn(rows);

          const reviews = rows
            .map((r) => {
              const text = (textCol ? r[textCol] : Object.values(r).join(" ")).trim();
              return {
                text: text || "",
                date: r.date || r.created_at || r.timestamp || undefined,
                source: "csv",
              };
            })
            .filter((r): r is ReviewItem => r.text.length > 3);

          const rawReviews = reviews.map((r) => r.text);
          resolve({ reviews, rawReviews });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

/**
 * Parse Excel file (XLSX/XLS)
 */
export function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet);

        if (!rows.length) {
          resolve({ reviews: [], rawReviews: [] });
          return;
        }

        const textCol = extractTextColumn(rows);

        const reviews = rows
          .map((r) => {
            const text = (textCol ? r[textCol] : Object.values(r).join(" ")).trim();
            return {
              text: text || "",
              date: r.date || r.created_at || r.timestamp || undefined,
              source: "excel",
            };
          })
          .filter((r): r is ReviewItem => r.text.length > 3);

        const rawReviews = reviews.map((r) => r.text);
        resolve({ reviews, rawReviews });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse JSON file
 */
export function parseJSON(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let data = JSON.parse(text);

        // Handle array or object with array property
        if (!Array.isArray(data)) {
          const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
          if (arrayKey) data = data[arrayKey];
          else data = [data];
        }

        const reviews = data
          .map((item: unknown) => {
            if (typeof item === "string") {
              return { text: item, date: undefined, source: "json" };
            }
            if (typeof item === "object" && item !== null) {
              const obj = item as Record<string, unknown>;
              const text = obj.text || obj.review || obj.comment || obj.content || JSON.stringify(obj);
              return {
                text: String(text).trim(),
                date: obj.date || obj.created_at || obj.timestamp ? String(obj.date || obj.created_at || obj.timestamp) : undefined,
                source: "json",
              };
            }
            return null;
          })
          .filter((r): r is ReviewItem => r !== null && r.text.length > 3);

        const rawReviews = reviews.map((r) => r.text);
        resolve({ reviews, rawReviews });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Parse TXT file (one review per line or paragraph)
 */
export function parseTXT(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        // Split by double newlines (paragraphs) or single newlines (lines)
        const separator = text.includes("\n\n") ? "\n\n" : "\n";
        const lines = text.split(separator).map((l) => l.trim()).filter((l) => l.length > 3);

        const reviews = lines.map((text) => ({
          text,
          date: undefined,
          source: "txt",
        }));

        const rawReviews = reviews.map((r) => r.text);
        resolve({ reviews, rawReviews });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Auto-detect file type and parse
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith(".csv") || type === "text/csv") {
    return parseCSV(file);
  }

  if (name.endsWith(".xlsx") || type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return parseExcel(file);
  }

  if (name.endsWith(".xls") || type === "application/vnd.ms-excel") {
    return parseExcel(file);
  }

  if (name.endsWith(".json") || type === "application/json") {
    return parseJSON(file);
  }

  if (name.endsWith(".txt") || type === "text/plain") {
    return parseTXT(file);
  }

  // Default: try CSV first, then JSON, then TXT
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
export function filterByDateRange(
  reviews: ReviewItem[],
  startDate?: Date,
  endDate?: Date
): ReviewItem[] {
  if (!startDate && !endDate) return reviews;

  return reviews.filter((r) => {
    if (!r.date) return true; // Include reviews without dates

    try {
      const reviewDate = new Date(r.date);
      if (startDate && reviewDate < startDate) return false;
      if (endDate && reviewDate > endDate) return false;
      return true;
    } catch {
      return true; // Include if date parsing fails
    }
  });
}
