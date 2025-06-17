'use client';

import Marquee from '@/components/Marquee';
import { isModuleEnabled } from '@/lib/moduleChecker';

export default function HelloPage() {
  const marqueeEnabled = isModuleEnabled('marquee');
  console.log('🧩 isModuleEnabled(marquee):', marqueeEnabled);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Hello World</h1>

      {marqueeEnabled && <Marquee />}
    </div>
  );
}
