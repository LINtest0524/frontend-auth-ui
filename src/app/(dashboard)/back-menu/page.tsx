'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface MenuItem {
  id: number
  label: string
  href: string
  order: number
  requiresLogin: boolean
  newTab: boolean
  children?: MenuItem[]
}

export default function BackMenuPage() {
  const [desktopMenus, setDesktopMenus] = useState<MenuItem[]>([])
  const [mobileMenus, setMobileMenus] = useState<MenuItem[]>([])

  const handleUpdateMenu = (menus: MenuItem[], setMenus: (m: MenuItem[]) => void, index: number, updatedItem: Partial<MenuItem>) => {
    const newMenus = [...menus]
    newMenus[index] = { ...newMenus[index], ...updatedItem }
    setMenus(newMenus)
  }

  const handleAddSubmenu = (menus: MenuItem[], setMenus: (m: MenuItem[]) => void, parentIndex: number) => {
    const newMenus = [...menus]
    const children = newMenus[parentIndex].children || []
    children.push({
      id: Date.now(),
      label: '',
      href: '',
      order: 0,
      requiresLogin: false,
      newTab: false
    })
    newMenus[parentIndex].children = children
    setMenus(newMenus)
  }

  const renderMenus = (menus: MenuItem[], setMenus: (m: MenuItem[]) => void, level: number = 1) => {
    return menus.map((item, index) => (
      <Card key={item.id} className={`p-4 mb-2 space-y-2 ${level > 1 ? 'ml-6 border-l-2 border-gray-300' : ''}`}>
        <Input
          placeholder="選單名稱"
          value={item.label}
          onChange={e => handleUpdateMenu(menus, setMenus, index, { label: e.target.value })}
        />
        <Input
          placeholder="連結網址"
          value={item.href}
          onChange={e => handleUpdateMenu(menus, setMenus, index, { href: e.target.value })}
        />
        <Input
          placeholder="排序數字（大在前）"
          value={item.order}
          type="number"
          onChange={e => handleUpdateMenu(menus, setMenus, index, { order: Number(e.target.value) })}
        />
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2">
            <Switch
              checked={item.requiresLogin}
              onCheckedChange={v => handleUpdateMenu(menus, setMenus, index, { requiresLogin: v })}
            />
            需要登入才顯示
          </label>
          <label className="flex items-center gap-2">
            <Switch
              checked={item.newTab}
              onCheckedChange={v => handleUpdateMenu(menus, setMenus, index, { newTab: v })}
            />
            另開新視窗
          </label>
        </div>

        <div className="flex gap-2">
          {level < 2 && (
            <Button
              variant="default"
              onClick={() => handleAddSubmenu(menus, setMenus, index)}
            >
              ➕ 新增子選單
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => setMenus(menus.filter((_, i) => i !== index))}
          >
            刪除
          </Button>
        </div>

        {item.children && renderMenus(item.children, newChildren => {
          const newMenus = [...menus]
          newMenus[index].children = newChildren
          setMenus(newMenus)
        }, level + 1)}
      </Card>
    ))
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">選單管理</h1>

      <Tabs defaultValue="desktop">
        <TabsList>
          <TabsTrigger value="desktop">電腦版選單</TabsTrigger>
          <TabsTrigger value="mobile">手機版選單</TabsTrigger>
        </TabsList>

        <TabsContent value="desktop">
          <div className="space-y-2">
            {renderMenus(desktopMenus, setDesktopMenus)}
            <Button
              onClick={() =>
                setDesktopMenus(prev => [...prev, {
                  id: Date.now(),
                  label: '',
                  href: '',
                  order: 0,
                  requiresLogin: false,
                  newTab: false
                }])
              }
            >
              ➕ 新增選單項目
            </Button>
            <Button
              className="ml-4"
              variant="outline"
              onClick={() => console.log('💾 儲存結果：', desktopMenus)}
            >
              💾 儲存設定
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="mobile">
          <div className="space-y-2">
            {renderMenus(mobileMenus, setMobileMenus)}
            <Button
              onClick={() =>
                setMobileMenus(prev => [...prev, {
                  id: Date.now(),
                  label: '',
                  href: '',
                  order: 0,
                  requiresLogin: false,
                  newTab: false
                }])
              }
            >
              ➕ 新增選單項目
            </Button>
            <Button
              className="ml-4"
              variant="outline"
              onClick={() => console.log('💾 儲存結果：', mobileMenus)}
            >
              💾 儲存設定
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
