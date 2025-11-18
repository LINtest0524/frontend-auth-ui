import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  params: Promise<{
    companyCode: string;
    agentSubdomain: string;
  }>;
}

export default async function AgentSubdomainLayout({ children, params }: LayoutProps) {
  const { companyCode, agentSubdomain } = await params;
  
  return (
    <>
      {/* 代理商標識條 - 只顯示一個小標識 */}
      <div style={{ 
        backgroundColor: '#007bff', 
        color: 'white',
        padding: '4px 10px', 
        fontSize: '12px',
        textAlign: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        🏢 {agentSubdomain} 代理商專屬頁面
      </div>
      {/* 為固定的代理商標識條添加頂部間距 */}
      <div style={{ paddingTop: '28px' }}>
        {children}
      </div>
    </>
  );
}