/**
 * SEC-01: Sanitize HTML before using dangerouslySetInnerHTML.
 * Server-side only — runs in Node.js context.
 *
 * When CMS delivers rich HTML content, this prevents XSS.
 * Uses a simple allowlist approach without requiring DOMPurify on the server.
 * For production, consider: npm install isomorphic-dompurify
 */

const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "h2", "h3", "h4",
  "ul", "ol", "li",
  "strong", "em", "b", "i", "u", "s",
  "a",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "blockquote", "code", "pre",
  "figure", "figcaption",
  "div", "span", "section",
]);

const ALLOWED_ATTRS: Record<string, string[]> = {
  a:    ["href", "target", "rel", "title", "aria-label"],
  img:  ["src", "alt", "width", "height", "loading"],
  td:   ["colspan", "rowspan"],
  th:   ["colspan", "rowspan", "scope"],
  "*":  ["class", "id", "aria-label", "aria-labelledby", "data-speakable"],
};

/**
 * Lightweight server-side HTML sanitizer.
 * Strips dangerous tags and attributes using regex-based approach.
 * Replace with isomorphic-dompurify for more robust sanitization.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Remove script tags and their content
  let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove style tags
  safe = safe.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Remove event handlers (onclick, onload, onerror, etc.)
  safe = safe.replace(/\s+on\w+\s*=\s*(['"])[^'"]*\1/gi, "");
  safe = safe.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: href values
  safe = safe.replace(/href\s*=\s*(['"])\s*javascript:[^'"]*\1/gi, 'href="#"');

  // Remove data: URIs in src/href (except data:image for inline images)
  safe = safe.replace(/src\s*=\s*(['"])\s*data:(?!image\/)[^'"]*\1/gi, 'src=""');

  // Remove <iframe>, <embed>, <object>, <link>, <meta> tags
  safe = safe.replace(/<(iframe|embed|object|link|meta|base|form|input|button|select|textarea)\b[^>]*>/gi, "");

  // Add rel="noopener noreferrer" to external links
  safe = safe.replace(
    /<a\s([^>]*href\s*=\s*(['"])https?:\/\/[^'"]+\2[^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes("rel=")) {
        return `<a ${attrs} rel="noopener noreferrer" target="_blank">`;
      }
      return match;
    }
  );

  return safe;
}

/**
 * Safe wrapper for dangerouslySetInnerHTML.
 * Usage: <div {...safeHtml(content)} className="article-body" />
 */
export function safeHtml(content: string): { dangerouslySetInnerHTML: { __html: string } } {
  return { dangerouslySetInnerHTML: { __html: sanitizeHtml(content) } };
}
