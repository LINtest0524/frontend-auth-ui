'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LOGIN_METHODS = [
  { value: 'USERNAME_PASSWORD', label: '帳號密碼' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'LINE', label: 'LINE' }
];

const PASSWORD_MODES = [
  { value: 'OLD_PASSWORD', label: '舊密碼模式' },
  { value: 'NEW_PASSWORD', label: '新密碼模式' }
];

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    domain: '',
    status: 'active',
    loginMethods: ['USERNAME_PASSWORD', 'FACEBOOK'],
    passwordModes: ['OLD_PASSWORD'],
    settings: {
      theme: '',
      features: [] as string[],
      branding: {
        primaryColor: '',
        secondaryColor: '',
        logo: ''
      }
    }
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value
      }
    }));
  };

  const handleBrandingChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        branding: {
          ...prev.settings.branding,
          [field]: value
        }
      }
    }));
  };

  const handleLoginMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      loginMethods: checked 
        ? [...prev.loginMethods, method]
        : prev.loginMethods.filter(m => m !== method)
    }));
  };

  const handlePasswordModeChange = (mode: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      passwordModes: checked 
        ? [...prev.passwordModes, mode]
        : prev.passwordModes.filter(m => m !== mode)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      alert('請填寫公司名稱和代碼');
      return;
    }

    if (formData.loginMethods.length === 0) {
      alert('請至少選擇一種登入方式');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/admin/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '新增公司失敗');
      }

      const result = await response.json();
      alert('公司新增成功！');
      router.push('/admin/companies');
    } catch (err) {
      alert(err instanceof Error ? err.message : '新增失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 標題 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/companies">
          <Button variant="outline">← 返回</Button>
        </Link>
        <h1 className="text-2xl font-bold">新增公司</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本資訊 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">基本資訊</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">公司名稱 *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="請輸入公司名稱"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="code">公司代碼 *</Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                placeholder="例如: a, b, company1"
                required
              />
              <div className="text-sm text-gray-500 mt-1">
                用於 URL 路徑和系統識別，只能包含英文字母和數字
              </div>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="description">公司描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="請輸入公司描述"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="domain">專屬網域</Label>
              <Input
                id="domain"
                type="text"
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value)}
                placeholder="例如: company.example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="status">狀態</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="active">啟用</option>
                <option value="inactive">停用</option>
              </select>
            </div>
          </div>
        </Card>

        {/* 登入設定 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">登入設定</h2>
          
          <div className="space-y-4">
            <div>
              <Label>登入方式 *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {LOGIN_METHODS.map((method) => (
                  <div key={method.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`login-${method.value}`}
                      checked={formData.loginMethods.includes(method.value)}
                      onCheckedChange={(checked) => 
                        handleLoginMethodChange(method.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`login-${method.value}`}>{method.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>密碼模式</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {PASSWORD_MODES.map((mode) => (
                  <div key={mode.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`password-${mode.value}`}
                      checked={formData.passwordModes.includes(mode.value)}
                      onCheckedChange={(checked) => 
                        handlePasswordModeChange(mode.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`password-${mode.value}`}>{mode.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 品牌設定 */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">品牌設定（可選）</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="theme">主題</Label>
              <Input
                id="theme"
                type="text"
                value={formData.settings.theme}
                onChange={(e) => handleSettingsChange('theme', e.target.value)}
                placeholder="例如: blue, red, custom"
              />
            </div>
            
            <div>
              <Label htmlFor="primaryColor">主要顏色</Label>
              <Input
                id="primaryColor"
                type="color"
                value={formData.settings.branding.primaryColor}
                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="secondaryColor">次要顏色</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={formData.settings.branding.secondaryColor}
                onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                type="url"
                value={formData.settings.branding.logo}
                onChange={(e) => handleBrandingChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>
        </Card>

        {/* 提交按鈕 */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? '新增中...' : '新增公司'}
          </Button>
          <Link href="/admin/companies">
            <Button type="button" variant="outline">取消</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}