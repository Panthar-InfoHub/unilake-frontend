import sanitizeHtml from "sanitize-html";

interface BlogBodyRendererProps {
  html: string;
}

/**
 * Renders admin-authored rich-text HTML (blog articles and the legal pages).
 *
 * Sanitising is deliberately done at render time rather than on write: a post
 * sanitised only on save stays dangerous forever if a bad row ever lands in the
 * database, whereas this runs on every read.
 *
 * ⚠️ DO NOT switch this back to `isomorphic-dompurify`.
 *
 * It was used here until Sep 2026 and took the whole page down in production.
 * DOMPurify needs a DOM, so on the server `isomorphic-dompurify` pulls in
 * `jsdom` — and jsdom depends on seven ESM-only packages while Next.js treats
 * jsdom as an *external* package, meaning it is `require()`d at runtime rather
 * than bundled. On Vercel's Node that throws ERR_REQUIRE_ESM before a single
 * line of our code runs, crashing the function with FUNCTION_INVOCATION_FAILED.
 * Every page rendering this component 500'd: /blog/[slug], /privacy, /terms and
 * /refund.
 *
 * It never reproduced locally, and it never will: `next dev` resolves modules
 * differently, and Node 22.12+ allows require() of ESM anyway, so a developer
 * machine hides the fault entirely.
 *
 * `sanitize-html` is plain JavaScript with no DOM, so there is no jsdom and
 * nothing to fake. It is also not in Next's default external list, so it is
 * bundled at build time instead of required at runtime — which is what makes it
 * immune to this whole class of failure regardless of the Node version Vercel
 * happens to run.
 */

/**
 * The allowlist is built from what the TipTap editor can actually produce, not
 * from what the toolbar has buttons for — markdown shortcuts create code blocks
 * (```) and horizontal rules (---) with no button, and pasted content can carry
 * both. Anything absent is dropped.
 *
 * `class` is kept on `a` and `img` because the editor bakes Tailwind classes
 * into them at insert time (rounded, centred images; purple underlined links).
 * Stripping it would silently restyle every post already published. The values
 * come from admins only and are inert — a class name cannot execute.
 *
 * `allowedSchemes` is the line doing the real security work: it is what stops a
 * `javascript:` URL surviving inside an href.
 */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // structure — h1 is deliberately absent, the page owns it for the title
    "p",
    "br",
    "hr",
    "h2",
    "h3",
    "h4",
    // inline marks
    "strong",
    "b",
    "em",
    "i",
    "s",
    "code",
    "pre",
    // blocks
    "blockquote",
    "ul",
    "ol",
    "li",
    // media
    "a",
    "img",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel", "class"],
    img: ["src", "alt", "title", "width", "height", "class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
};

export default function BlogBodyRenderer({ html }: BlogBodyRendererProps) {
  const sanitizedHtml = sanitizeHtml(html, SANITIZE_OPTIONS);

  return (
    <div
      className="prose prose-purple max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
