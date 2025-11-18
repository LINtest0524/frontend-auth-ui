'use client'

import { useState } from 'react'
import { MenuItem } from './MenuRenderer'
import { useAgentContext } from '@/hooks/useAgentContext'

interface DesktopMenuProps {
  menus: MenuItem[]
}

export default function DesktopMenu({ menus }: DesktopMenuProps) {
  const { getLinkWithAgent } = useAgentContext()
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [activeSubDropdown, setActiveSubDropdown] = useState<number | null>(null)
  const [leaveTimer, setLeaveTimer] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (menuId: number, isSubMenu: boolean = false) => {
    // 清除之前的延遲關閉計時器
    if (leaveTimer) {
      clearTimeout(leaveTimer)
      setLeaveTimer(null)
    }
    
    if (isSubMenu) {
      setActiveSubDropdown(menuId)
    } else {
      setActiveDropdown(menuId)
      setActiveSubDropdown(null) // 重置子選單
    }
  }

  const handleMouseLeave = () => {
    // 設置延遲關閉，給用戶時間移動到子選單
    const timer = setTimeout(() => {
      setActiveDropdown(null)
      setActiveSubDropdown(null)
    }, 300) // 增加延遲時間到300ms
    setLeaveTimer(timer)
  }

  const handleSubmenuEnter = () => {
    // 滑鼠進入子選單時，取消關閉計時器
    if (leaveTimer) {
      clearTimeout(leaveTimer)
      setLeaveTimer(null)
    }
  }

  const handleSubmenuLeave = () => {
    // 離開子選單時，設置延遲關閉
    const timer = setTimeout(() => {
      setActiveDropdown(null)
      setActiveSubDropdown(null)
    }, 300) // 增加延遲時間到300ms
    setLeaveTimer(timer)
  }

  const renderMenuItem = (item: MenuItem, level: number = 1) => {
    const hasChildren = item.children && item.children.length > 0
    
    // 根據層級決定是否顯示
    let isActive = false
    if (level === 1) {
      isActive = activeDropdown === item.id
    } else if (level === 2) {
      isActive = activeSubDropdown === item.id
    }

    return (
      <li
        key={item.id}
        className={`menu-item menu-item-level-${level} ${hasChildren ? 'has-children' : ''} ${isActive ? 'active' : ''}`}
        onMouseEnter={() => {
          if (hasChildren) {
            if (level === 1) {
              handleMouseEnter(item.id, false)
            } else if (level === 2) {
              handleMouseEnter(item.id, true)
            }
          }
        }}
        onMouseLeave={() => hasChildren && handleMouseLeave()}
      >
        {item.url ? (
          <a
            href={getLinkWithAgent(item.url)}
            target={item.target_blank ? '_blank' : '_self'}
            rel={item.target_blank ? 'noopener noreferrer' : undefined}
            className="menu-link"
          >
            {item.icon && <i className={`menu-icon ${item.icon}`}></i>}
            <span className="menu-title">{item.title}</span>
            {hasChildren && <i className="dropdown-arrow">▼</i>}
          </a>
        ) : (
          <span className="menu-link menu-no-link">
            {item.icon && <i className={`menu-icon ${item.icon}`}></i>}
            <span className="menu-title">{item.title}</span>
            {hasChildren && <i className="dropdown-arrow">▼</i>}
          </span>
        )}

        {hasChildren && (
          <ul 
            className={`submenu submenu-level-${level + 1} ${isActive ? 'show' : ''}`}
            onMouseEnter={handleSubmenuEnter}
            onMouseLeave={handleSubmenuLeave}
          >
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav className="desktop-menu">
      <ul className="menu-list">
        {menus.map(item => renderMenuItem(item))}
      </ul>
    </nav>
  )
}