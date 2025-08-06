'use client'

import { useEffect, useState } from 'react'

interface Company {
  id: number
  name: string
}

interface ModuleStatus {
  [moduleKey: string]: boolean
}

const availableModules = [
  { key: 'marquee', name: '跑馬燈' },
  { key: 'banner', name: '橫幅廣告' }
]

export default function ModuleAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus>({})
  const [loading, setLoading] = useState(false)

  // 載入公司列表
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token')
        // 先嘗試從模組 API 獲取公司列表
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/module/marquee`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        
        const data = await res.json()
        console.log('模組 API 回傳資料:', data)
        
        // 從模組資料中提取公司列表
        if (Array.isArray(data)) {
          const uniqueCompanies = data.map(item => ({
            id: item.companyId,
            name: item.companyName
          }))
          // 去重複
          const companies = uniqueCompanies.filter((company, index, self) => 
            index === self.findIndex(c => c.id === company.id)
          )
          setCompanies(companies)
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

  // 當選擇公司時，載入該公司的模組狀態
  useEffect(() => {
    if (!selectedCompanyId) {
      setModuleStatus({})
      return
    }

    const fetchModuleStatus = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        const status: ModuleStatus = {}
        
        // 並行載入所有模組的狀態
        await Promise.all(
          availableModules.map(async (module) => {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_BASE}/admin/module/${module.key}`,
              { headers: { Authorization: `Bearer ${token}` } }
            )
            const data = await res.json()
            const companyData = data.find((item: any) => item.companyId === selectedCompanyId)
            status[module.key] = companyData?.enabled || false
          })
        )
        
        setModuleStatus(status)
      } catch (error) {
        console.error('載入模組狀態失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchModuleStatus()
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

  const saveChanges = async () => {
    if (!selectedCompanyId) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // 並行更新所有模組
      await Promise.all(
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
      )

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
              {selectedCompany?.name} - 功能模組設定
            </h2>

            {loading ? (
              <p>載入中...</p>
            ) : (
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
