import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{
    companyCode: string;
    agentSubdomain: string;
  }>
}

export default async function AgentSubdomainPage({ params }: PageProps) {
  const { companyCode, agentSubdomain } = await params;
  
  // 代理商子網域的首頁重定向到公司主頁，但保持代理商上下文
  redirect(`/${companyCode}?agent=${agentSubdomain}`);
}