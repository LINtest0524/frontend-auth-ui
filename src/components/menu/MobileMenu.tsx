'use client'

import { useState } from 'react'
import { MenuItem } from './MenuRenderer'
import { useAgentContext } from '@/hooks/useAgentContext'

interface MobileMenuProps {
  menus: MenuItem[]
}

export default function MobileMenu({ menus }: MobileMenuProps) {
  const { getLinkWithAgent } = useAgentContext()
  const [isOpen, setIsOpen] = useState(false)
  const [openSubmenus, setOpenSubmenus] = useState<Set<number>>(new Set())

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const toggleSubmenu = (menuId: number, level: number = 1) => {
    const newOpenSubmenus = new Set(openSubmenus)
    
    if (newOpenSubmenus.has(menuId)) {
      // 如果當前選單已展開，則收起它
      newOpenSubmenus.delete(menuId)
    } else {
      // 如果要展開新選單，先收起同級的其他選單
      if (level === 1) {
        // 一級選單：收起所有其他一級選單
        menus.forEach(menu => {
          if (menu.id !== menuId) {
            newOpenSubmenus.delete(menu.id)
            // 同時收起該選單的所有子選單
            if (menu.children) {
              menu.children.forEach(child => {
                newOpenSubmenus.delete(child.id)
              })
            }
          }
        })
      } else if (level === 2) {
        // 二級選單：只收起同一父選單下的其他二級選單
        const parentMenu = findParentMenu(menuId)
        if (parentMenu?.children) {
          parentMenu.children.forEach(child => {
            if (child.id !== menuId) {
              newOpenSubmenus.delete(child.id)
            }
          })
        }
      }
      
      // 展開當前選單
      newOpenSubmenus.add(menuId)
    }
    
    setOpenSubmenus(newOpenSubmenus)
  }

  // 找到指定選單的父選單
  const findParentMenu = (childId: number) => {
    for (const menu of menus) {
      if (menu.children?.some(child => child.id === childId)) {
        return menu
      }
    }
    return null
  }

  const closeMenu = () => {
    setIsOpen(false)
    setOpenSubmenus(new Set())
  }

  const renderMenuItem = (item: MenuItem, level: number = 1) => {
    const hasChildren = item.children && item.children.length > 0
    const isSubmenuOpen = openSubmenus.has(item.id)

    return (
      <li key={item.id} className={`mobile-menu-item mobile-menu-item-level-${level}`}>
        <div className="mobile-menu-item-content">
          {hasChildren ? (
            // 有子選單的項目：整個區域都可以點擊展開
            <button
              className="mobile-menu-link mobile-menu-expandable"
              onClick={() => toggleSubmenu(item.id, level)}
            >
              {item.icon && <i className={`mobile-menu-icon ${item.icon}`}></i>}
              <span className="mobile-menu-title">{item.title}</span>
              <i className={`toggle-icon ${isSubmenuOpen ? 'open' : ''}`}>▼</i>
            </button>
          ) : item.url ? (
            // 沒有子選單且有連結的項目：點擊跳轉
            <a
              href={getLinkWithAgent(item.url)}
              target={item.target_blank ? '_blank' : '_self'}
              rel={item.target_blank ? 'noopener noreferrer' : undefined}
              className="mobile-menu-link"
              onClick={closeMenu}
            >
              {item.icon && <i className={`mobile-menu-icon ${item.icon}`}></i>}
              <span className="mobile-menu-title">{item.title}</span>
            </a>
          ) : (
            // 沒有子選單也沒有連結的項目：純顯示
            <span className="mobile-menu-link mobile-menu-no-link">
              {item.icon && <i className={`mobile-menu-icon ${item.icon}`}></i>}
              <span className="mobile-menu-title">{item.title}</span>
            </span>
          )}
        </div>

        {hasChildren && (
          <ul className={`mobile-submenu mobile-submenu-level-${level + 1} ${isSubmenuOpen ? 'open' : ''}`}>
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="mobile-menu">
      <button
        className={`mobile-menu-toggle ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label="切換選單"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      <div className={`mobile-menu-overlay ${isOpen ? 'open' : ''}`} onClick={closeMenu}></div>

      <nav className={`mobile-menu-nav ${isOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <h3>選單</h3>
          <button className="mobile-menu-close" onClick={closeMenu} aria-label="關閉選單">
            ✕
          </button>
        </div>

        <ul className="mobile-menu-list">
          {menus.map(item => renderMenuItem(item))}
        </ul>
      </nav>
    </div>
  )
}