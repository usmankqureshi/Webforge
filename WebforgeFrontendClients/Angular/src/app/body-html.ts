// Existing plain-text posts retain literal characters and line breaks.
export function bodyHtml(value: string): string {
  if (/<\/?(?:p|h[1-6]|ul|ol|li|blockquote|pre|strong|em|a|br|div)\b[^>]*>/i.test(value)) return value;
  return value.split('\n').map(line => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('');
}

