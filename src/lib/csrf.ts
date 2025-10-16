// CSRF Token 生成和驗證工具
export class CsrfTokenManager {
  // 生成 CSRF Token
  static generateToken(): string {
    const timestamp = Date.now().toString();
    const nonce = this.generateNonce();
    
    const tokenData = {
      timestamp,
      nonce
    };
    
    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }
  
  // 生成隨機字符串
  private static generateNonce(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // 獲取帶有 CSRF Token 的請求頭
  static getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-CSRF-Token': this.generateToken(),
      ...additionalHeaders
    };
  }
}