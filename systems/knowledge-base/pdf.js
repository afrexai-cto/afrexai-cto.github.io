// PDF ingestion
import fetch from 'node-fetch';
import { readFileSync } from 'fs';

export function isPdfUrl(url) {
  return url.toLowerCase().endsWith('.pdf') || url.includes('/pdf/');
}

export async function fetchPdfData(url) {
  let buffer;
  if (url.startsWith('file://') || url.startsWith('/')) {
    const path = url.replace('file://', '');
    buffer = readFileSync(path);
  } else {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
    buffer = Buffer.from(await res.arrayBuffer());
  }

  // Dynamic import for pdf-parse (CommonJS module)
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);

  return {
    type: 'pdf',
    title: data.info?.Title || url.split('/').pop() || 'PDF Document',
    author: data.info?.Author || null,
    url,
    content: data.text,
    metadata: {
      pages: data.numpages,
      pdfInfo: data.info || {}
    }
  };
}
