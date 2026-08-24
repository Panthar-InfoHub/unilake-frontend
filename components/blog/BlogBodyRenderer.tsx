"use client";

import DOMPurify from "dompurify";
import { useEffect, useState } from "react";

interface BlogBodyRendererProps {
  html: string;
}

export default function BlogBodyRenderer({ html }: BlogBodyRendererProps) {
  const [sanitizedHtml, setSanitizedHtml] = useState<string>("");

  useEffect(() => {
    // DOMPurify only works in the browser
    if (typeof window !== "undefined") {
      setSanitizedHtml(DOMPurify.sanitize(html));
    }
  }, [html]);

  // Initial SSR render won't have sanitized HTML, we show an empty div or skeleton
  // Alternatively, we can use a basic dangerouslySetInnerHTML with un-sanitized HTML if we 
  // want to avoid layout shift, but since we MUST sanitize, it's safer to wait for hydration.
  // We'll just render it dangerously on the server (which might be risky if we don't sanitize on server) 
  // Wait, DOMPurify CAN work on the server with JSDOM, but since we don't have JSDOM installed,
  // we can use isomorphic-dompurify or just sanitize on client. 
  // A common pattern is to render dangerously on server because the admin wrote it, and then
  // sanitize on client just in case. But actually, we can just use dangerouslySetInnerHTML directly 
  // if we install isomorphic-dompurify. 
  // Let's stick to client-side only rendering for now, or just dangerouslySetInnerHTML with the 
  // sanitized output when mounted.

  return (
    <div 
      className="prose prose-purple max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
}
