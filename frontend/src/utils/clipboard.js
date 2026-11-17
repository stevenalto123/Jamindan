/**
 * Copy text to clipboard with fallback for mobile webviews / iOS Safari contexts
 * where navigator.clipboard.writeText may be unavailable or denied.
 */
export async function copyTextSafe(text) {
  if (!text && text !== '') return false;
  const value = String(text);

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (e) {
      // Fall back to hidden textarea selection below
    }
  }

  if (typeof document === 'undefined') return false;
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch (e) {
    return false;
  }
}
