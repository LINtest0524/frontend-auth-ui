'use client';

import { useEffect, useState } from 'react';

interface Prize {
  id: number;
  name: string;
  image_url: string;
  quantity: number;
  probability: number;
}

export default function Wheel() {
  const [prizes, setPrizes] = useState<Prize[]>([]);

  const fetchPrizes = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3001/lucky-prize', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (Array.isArray(data)) setPrizes(data);
    else if (Array.isArray(data.data)) setPrizes(data.data);
  };

  useEffect(() => {
    fetchPrizes();
  }, []);

  const radius = 200;
  const center = radius;
  const itemCount = prizes.length;
  const anglePerItem = 360 / itemCount;

  return (
    <div
      style={{
        width: radius * 2,
        height: radius * 2,
        borderRadius: '50%',
        border: '10px solid #333',
        position: 'relative',
        margin: '0 auto',
      }}
    >
      {prizes.map((prize, index) => {
        const angle = anglePerItem * index - 90;
        const rad = (angle * Math.PI) / 180;
        const x = center + radius * 0.75 * Math.cos(rad);
        const y = center + radius * 0.75 * Math.sin(rad);

        return (
          <div
            key={prize.id}
            style={{
              position: 'absolute',
              top: y,
              left: x,
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              width: 80,
            }}
          >
            <img
              src={prize.image_url}
              alt={prize.name}
              style={{ width: 50, height: 50, objectFit: 'contain' }}
            />
            <div style={{ fontSize: 12 }}>{prize.name}</div>
          </div>
        );
      })}

      <p style={{ position: 'absolute', top: '45%', left: '45%' }}>🎯</p>
    </div>
  );
}
