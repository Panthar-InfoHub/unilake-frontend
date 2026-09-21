import DOMPurify from "isomorphic-dompurify";

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
 * `isomorphic-dompurify` is what makes this a server component — plain
 * `dompurify` needs a DOM, so the body used to sit empty until the browser
 * hydrated. That meant a visible flash of empty article, images that only began
 * loading after hydration, and search engines indexing a blank page.
 */
export default function BlogBodyRenderer({ html }: BlogBodyRendererProps) {
  const sanitizedHtml = DOMPurify.sanitize(html);

  return (
    <div
      className="prose prose-purple max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
