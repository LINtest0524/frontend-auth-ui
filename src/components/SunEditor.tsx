'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// 動態導入 SunEditor 以避免 SSR 問題
const SunEditorReact = dynamic(
  () => import('suneditor-react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div>載入編輯器中...</div>
  }
)

// 導入 SunEditor 樣式
import 'suneditor/dist/css/suneditor.min.css'

interface SunEditorProps {
  value: string
  onChange: (content: string) => void
  placeholder?: string
  height?: string
}

export default function SunEditor({ 
  value, 
  onChange, 
  placeholder = '請輸入內容...', 
  height = '400px' 
}: SunEditorProps) {

  const handleChange = (content: string) => {
    onChange(content)
  }

  const handleBeforeChange = (contents: string, core: any) => {
    // 直接返回原始內容，不進行任何過濾
    return contents
  }

  return (
    <div className="suneditor-wrapper">
      <SunEditorReact
        setContents={value}
        onChange={handleChange}
        onBeforeChange={handleBeforeChange}
        setOptions={{
          height: height,
          placeholder: placeholder,
          buttonList: [
            ['undo', 'redo'],
            ['fontSize', 'formatBlock'],
            ['bold', 'underline', 'italic', 'strike'],
            ['fontColor', 'hiliteColor'],
            ['removeFormat'],
            ['outdent', 'indent'],
            ['align', 'list'],
            ['table', 'link', 'image'],
            ['fullScreen', 'codeView']
          ],
          fontSize: [8, 10, 12, 14, 16, 18, 20, 24, 28, 32],
          formats: ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
          // 自定義圖片上傳處理
          imageUploadHandler: (files: FileList, info: any, core: any, uploadHandler: any) => {
            const file = files[0]
            if (!file) return
            
            const formData = new FormData()
            formData.append('file', file)
            
            const xhr = new XMLHttpRequest()
            xhr.open('POST', `${process.env.NEXT_PUBLIC_API_BASE}/news/upload`)
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`)
            
            xhr.onload = function() {
              if (xhr.status === 200 || xhr.status === 201) {
                try {
                  const response = JSON.parse(xhr.responseText)
                  if (response.url) {
                    // 插入圖片到編輯器
                    const imageUrl = `${process.env.NEXT_PUBLIC_API_BASE}${response.url}`
                    core.insertImage(imageUrl, null, null, null, response.filename)
                  }
                } catch (error) {
                  console.error('解析回應失敗:', error)
                  alert('圖片上傳失敗：回應格式錯誤')
                }
              } else {
                console.error('上傳失敗:', xhr.status, xhr.responseText)
                alert('圖片上傳失敗，請重試')
              }
            }
            
            xhr.onerror = function() {
              console.error('網路錯誤')
              alert('網路錯誤，請檢查連線')
            }
            
            xhr.send(formData)
          },
          // 完全關閉 HTML 過濾和清理
          addTagsWhitelist: '*',
          pasteTagsWhitelist: '*',
          attributesWhitelist: '*',
          cleanHTML: false,
          allowDangerousHTML: true,
          // 關閉所有過濾器
          htmlRemoveFilter: false,
          // 保留所有標籤和屬性
          tagsBlacklist: '',
          attributesBlacklist: '',
          // 關閉自動格式化
          autoFormat: false,
          // 保留原始 HTML
          preserveWhitespace: true,
          // 使用原始模式
          mode: 'classic',
          // 關閉標籤驗證
          strictMode: false,
          // 允許所有內容
          allowedContent: true
        }}
      />
    </div>
  )
}