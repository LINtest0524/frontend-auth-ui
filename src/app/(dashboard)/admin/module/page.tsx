'use client'

import { useEffect, useState } from 'react'

interface Company {
  id: number
  name: string
  code?: string
  loginMethods?: string[]
}

interface ModuleStatus {
  [moduleKey: string]: boolean
}

interface LoginMethodsStatus {
  [methodKey: string]: boolean
}

const availableModules = [
  { key: 'marquee', name: '跑馬燈' },
  { key: 'banner', name: '橫幅廣告' }
]

const availableLoginMethods = [
  { key: 'USERNAME_PASSWORD', name: '帳號密碼登入' },
  { key: 'FACEBOOK', name: 'Facebook 登入' },
  { key: 'GOOGLE', name: 'Google 登入' },
  { key: 'LINE', name: 'LINE 登入' }
]

export default function ModuleAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>({})
  const [loginMethodsStatus, setLoginMethodsStatus] = useState<LoginMethodsStatus>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'modules' | 'loginMethods'>('modules')

  // 載入公司列表
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token')
        // 從 company API 獲取完整的公司資訊
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/company`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        console.log('公司 API 回傳資料:', data)
        
        if (Array.isArray(data)) {
          setCompanies(data)
        } else {
          console.error('API 回傳的不是陣列:', data)
          setCompanies([])
        }
      } catch (error) {
        console.error('載入公司列表失敗:', error)
        setCompanies([])
      }
    }
    fetchCompanies()
  }, [])

  // 當選擇公司時，載入該公司的模組狀態和登入方式
  useEffect(() => {
    if (!selectedCompanyId) {
      setModuleStatus({})
      setLoginMethodsStatus({})
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        
        // 並行載入模組狀態和登入方式
        const [moduleStatusResult, loginMethodsResult] = await Promise.all([
          // 載入模組狀態
          Promise.all(
            availableModules.map(async (module) => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE}/admin/module/${module.key}`,
                { headers: { Authorization: `Bearer ${token}` } }
              )
              const data = await res.json()
              const companyData = data.find((item: any) => item.companyId === selectedCompanyId)
              return { key: module.key, enabled: companyData?.enabled || false }
            })
          ),
          // 載入登入方式
          fetch(
            `${process.env.NEXT_PUBLIC_API_BASE}/company/${selectedCompanyId}/login-methods`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).then(res => res.json())
        ])
        
        // 設定模組狀態
        const moduleStatus: ModuleStatus = {}
        moduleStatusResult.forEach(item => {
          moduleStatus[item.key] = item.enabled
        })
        setModuleStatus(moduleStatus)
        
        // 設定登入方式狀態
        const loginMethods = loginMethodsResult.loginMethods || ['USERNAME_PASSWORD', 'FACEBOOK']
        const loginMethodsStatus: LoginMethodsStatus = {}
        availableLoginMethods.forEach(method => {
          loginMethodsStatus[method.key] = loginMethods.includes(method.key)
        })
        setLoginMethodsStatus(loginMethodsStatus)
        
      } catch (error) {
        console.error('載入資料失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedCompanyId])

  const toggleModule = (moduleKey: string) => {
    setModuleStatus(prev => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }))
  }

  const toggleAllModules = (enabled: boolean) => {
    const newStatus: ModuleStatus = {}
    availableModules.forEach(module => {
      newStatus[module.key] = enabled
    })
    setModuleStatus(newStatus)
  }

  const toggleLoginMethod = (methodKey: string) => {
    setLoginMethodsStatus(prev => ({
      ...prev,
      [methodKey]: !prev[methodKey]
    }))
  }

  const toggleAllLoginMethods = (enabled: boolean) => {
    const newStatus: LoginMethodsStatus = {}
    availableLoginMethods.forEach(method => {
      newStatus[method.key] = enabled
    })
    setLoginMethodsStatus(newStatus)
  }

  const saveChanges = async () => {
    if (!selectedCompanyId) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // 並行更新模組和登入方式
      await Promise.all([
        // 更新模組設定
        Promise.all(
          availableModules.map(async (module) => {
            // 先獲取當前所有公司的狀態
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/admin/module/${module.key}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            const allCompaniesData = await res.json()
            
            // 更新選中公司的狀態
            const updatedData = allCompaniesData.map((item: any) => 
              item.companyId === selectedCompanyId 
                ? { ...item, enabled: moduleStatus[module.key] || false }
                : item
            )
            
            // 儲存更新
            await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/admin/module/${module.key}`,
              {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(updatedData)
              }
            )
          })
        ),
        // 更新登入方式設定
        (async () => {
          const enabledLoginMethods = availableLoginMethods
            .filter(method => loginMethodsStatus[method.key])
            .map(method => method.key)
          
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE}/company/${selectedCompanyId}/login-methods`,
            {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({ loginMethods: enabledLoginMethods })
            }
          )
        })()
      ])

      // 派發事件通知全站：模組更新了
      window.dispatchEvent(new Event('enabled-modules-updated'))
      
      alert('設定已儲存！')
    } catch (error) {
      console.error('儲存失敗:', error)
      alert('儲存失敗，請重試')
    } finally {
      setLoading(false)
    }
  }

  const selectedCompany = Array.isArray(companies) ? companies.find(c => c.id === selectedCompanyId) : null

  return (
    <div className="b-bigbox-all w100">
      <div className="b-ibox mb30">
        <h1>模組管理</h1>

        <div className="b-ibox-s">
          <div className="b-form-group-1 w100 fl4 mb25">
            <label>選擇公司</label>
            <select
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(Number(e.target.value) || null)}
              className="w70"
            >
              <option value="">請選擇公司</option>
              {Array.isArray(companies) && companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCompanyId && (
        <div className="b-ibox">
          <div className="b-ibox-s">
            <h2 className="mb20">
              {selectedCompany?.name} - 系統設定
            </h2>

            {/* 分頁選項 */}
            <div className="mb30">
              <button 
                onClick={() => setActiveTab('modules')}
                className={`b-btn-s2 mr10 ${activeTab === 'modules' ? 'b-btn-c4' : 'b-btn-c2'}`}
              >
                功能模組設定
              </button>
              <button 
                onClick={() => setActiveTab('loginMethods')}
                className={`b-btn-s2 ${activeTab === 'loginMethods' ? 'b-btn-c4' : 'b-btn-c2'}`}
              >
                登入方式設定
              </button>
            </div>

            {loading ? (
              <p>載入中...</p>
            ) : (
              <>
                {/* 功能模組設定 */}
                {activeTab === 'modules' && (
                  <>
                    <div className="mb20">
                      <button 
                        onClick={() => toggleAllModules(true)}
                        className="b-btn-s2 b-btn-c4 mr10"
                      >
                        全部啟用
                      </button>
                      <button 
                        onClick={() => toggleAllModules(false)}
                        className="b-btn-s2 b-btn-c2"
                      >
                        全部停用
                      </button>
                    </div>

                    <div className="module-list">
                      {availableModules.map((module) => (
                        <div key={module.key} className="b-form-group-1 w100 fl4 mb15">
                          <label htmlFor={`module-${module.key}`} className="module-label">
                            <input
                              type="checkbox"
                              id={`module-${module.key}`}
                              checked={moduleStatus[module.key] || false}
                              onChange={() => toggleModule(module.key)}
                              className="new-checkbox mr10"
                            />
                            {module.name} ({module.key})
                          </label>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 登入方式設定 */}
                {activeTab === 'loginMethods' && (
                  <>
                    <div className="mb20">
                      <button 
                        onClick={() => toggleAllLoginMethods(true)}
                        className="b-btn-s2 b-btn-c4 mr10"
                      >
                        全部啟用
                      </button>
                      <button 
                        onClick={() => toggleAllLoginMethods(false)}
                        className="b-btn-s2 b-btn-c2"
                      >
                        全部停用
                      </button>
                    </div>

                    <div className="login-methods-list">
                      {availableLoginMethods.map((method) => (
                        <div key={method.key} className="b-form-group-1 w100 fl4 mb15">
                          <label htmlFor={`login-method-${method.key}`} className="module-label">
                            <input
                              type="checkbox"
                              id={`login-method-${method.key}`}
                              checked={loginMethodsStatus[method.key] || false}
                              onChange={() => toggleLoginMethod(method.key)}
                              className="new-checkbox mr10"
                            />
                            {method.name} ({method.key})
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="mb20 p20" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                      <h4 className="mb10">⚠️ 注意事項：</h4>
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        <li>至少需要啟用一種登入方式</li>
                        <li>「帳號密碼登入」是基本登入方式，建議保持啟用</li>
                        <li>停用 Facebook 登入後，現有 Facebook 用戶將無法登入</li>
                        <li>設定變更後立即生效</li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="fl4 w100 b-btnbox mt30">
                  <button
                    onClick={saveChanges}
                    disabled={loading}
                    className="b-btn-s2 b-btn-c4"
                  >
                    {loading ? '儲存中...' : '儲存設定'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
