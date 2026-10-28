import { Hono } from "hono";
import { DATABASE_SCHEMA_MD } from "../docs/database-schema";

// Router for the ERD preview endpoint.
// Serves /api/erd which returns an interactive Mermaid ERD preview
// built from the bundled database-schema.md (inlined at build time).
export const erdRouter = new Hono<{ Variables: { user: any } }>();

export async function erdHandler(c: any) {
  try {
    const { mermaidCode, fkRows } = parseSchema(DATABASE_SCHEMA_MD);
    const html = renderErdHtml(mermaidCode, fkRows);
    return c.html(html);
  } catch (err) {
    console.error("[ERD] failed to render ERD preview:", err);
    return c.json({ success: false, error: "Gagal memuat preview ERD." }, 500);
  }
}

erdRouter.get("/erd", erdHandler);

// ---------- Parsing helpers ----------

export interface FkRow {
  table: string;
  column: string;
  references: string;
}

export interface ErdData {
  mermaidCode: string;
  fkRows: FkRow[];
}

/**
 * Parse database-schema.md and extract:
 *  - the Mermaid `erDiagram` block (client-side rendered by Mermaid.js),
 *  - the foreign-key mapping table.
 */
export function parseSchema(markdown: string): ErdData {
  const mermaidMatch = markdown.match(/```mermaid\s*([\s\S]*?)```/);
  const mermaidCode = mermaidMatch?.[1]?.trim() ?? "";

  const fkRows: FkRow[] = [];
  const lines = markdown.split("\n");
  for (const rawLine of lines) {
    // FK rows look like: | `USERS` | `bengkel_id` | `BENGKEL.id` |
    if (rawLine.startsWith("|") && rawLine.includes("|") && !rawLine.startsWith("|--")) {
      const cells = rawLine
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      // cells: [table, column, references] — skip the header row
      if (cells.length >= 3 && cells[0] !== "Tabel" && cells[0] !== "Kolom `(FK)`") {
        fkRows.push({
          table: (cells[0] ?? "").replace(/`/g, ""),
          column: (cells[1] ?? "").replace(/`/g, ""),
          references: (cells[2] ?? "").replace(/`/g, ""),
        });
      }
    }
  }

  return { mermaidCode, fkRows };
}

export function renderErdHtml(mermaidCode: string, fkRows: FkRow[]): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Database Schema — ERD Preview</title>
  <meta name="description" content="Interactive ERD preview for Mossa Backend database schema." />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #fafafa; color: #222; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 1.4rem; margin: 0 0 4px; }
    .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 20px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px; }
    .card h2 { margin: 0 0 12px; font-size: 1.1rem; color: #1e293b; }
    .mermaid { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 12px 0; }
    table { border-collapse: collapse; width: 100%; font-size: 0.9rem; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; color: #475569; font-weight: 600; }
    .note { color: #64748b; font-size: 0.85rem; margin-top: 16px; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Mossa Backend — Database Schema</h1>
    <p class="subtitle">Interactive ERD preview generated from <code>database-schema.md</code> &nbsp;·&nbsp; <a href="/api/docs">OpenAPI docs →</a></p>

    <div class="card">
      <h2>Entity Relationship Diagram</h2>
      <div class="mermaid">
${mermaidCode}
      </div>
    </div>

    <div class="card">
      <h2>Foreign Key Mapping</h2>
      <table>
        <thead>
          <tr>
            <th>Table</th>
            <th>Column (FK)</th>
            <th>References</th>
          </tr>
        </thead>
        <tbody>
          ${fkRows.map((r) => `<tr><td>${h(r.table)}</td><td>${h(r.column)}</td><td>${h(r.references)}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="note">PK = Primary Key · FK = Foreign Key · \`||--o{\` artinya <strong>1 → banyak</strong>.</p>
    </div>

    <p class="note">Diagram rendered client-side with <a href="https://mermaid.js.org/" target="_blank" rel="noopener">Mermaid.js</a> (loaded via CDN). Source: <code>database-schema.md</code>.</p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: "default", securityLevel: "strict" });
  </script>
</body>
</html>`;

  function h(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}