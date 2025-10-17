// 基礎 HTML 清理功能 - XSS 防護
import createDOMPurify from 'isomorphic-dompurify';

const DOMPurify = createDOMPurify();

/**
 * 清理 HTML 字串，移除危險的腳本和事件屬性
 * @param dirty 原始HTML字串
 * @param options 可選的DOMPurify配置
 * @returns 清理後的安全HTML字串
 */
export function sanitizeHtml(dirty: string, options?: any): string {
  if (!dirty) return '';
  
  const defaultConfig = {
    // 禁止危險的事件屬性
    FORBID_ATTR: [
      'onclick', 'ondblclick', 'onmousedown', 'onmouseup', 'onmouseover', 'onmousemove', 'onmouseout',
      'onfocus', 'onblur', 'onkeypress', 'onkeydown', 'onkeyup',
      'onsubmit', 'onreset', 'onselect', 'onchange',
      'onload', 'onunload', 'onerror', 'onabort', 'onresize', 'onscroll'
    ],
    // 禁止危險的標籤（移除了 style，允許 CSS 樣式標籤）
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    // 允許 style 屬性（內聯樣式）和 <style> 標籤（用於表格設計和 CSS 偽元素）
    ALLOWED_ATTR: ['style', 'class', 'id', 'href', 'src', 'alt', 'title', 'target', 'rel', 'width', 'height'],
    // 其他安全配置
    RETURN_TRUSTED_TYPE: false,
    KEEP_CONTENT: true
  };
  
  try {
    return DOMPurify.sanitize(dirty, { ...defaultConfig, ...(options || {}) });
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    return ''; // 發生錯誤時返回空字串，確保安全
  }
}