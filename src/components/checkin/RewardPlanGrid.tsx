"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Reward {
  dayIndex: number;
  rewardType: 'CASH' | 'POINTS' | 'COUPON' | 'ITEM';
  amount?: number;
  metaJson?: any;
}

interface RewardPlanGridProps {
  days: number;
  rewards: Reward[];
  onChange: (rewards: Reward[]) => void;
}

export function RewardPlanGrid({ days, rewards, onChange }: RewardPlanGridProps) {

  // 確保獎勵陣列長度與天數一致
  const normalizedRewards = Array.from({ length: days }, (_, index) => {
    const existingReward = rewards.find(r => r.dayIndex === index + 1);
    return existingReward || {
      dayIndex: index + 1,
      rewardType: 'CASH' as const,
      amount: 0,
      metaJson: {},
    };
  });

  const updateReward = (dayIndex: number, field: keyof Reward, value: any) => {
    const newRewards = normalizedRewards.map(reward => 
      reward.dayIndex === dayIndex ? { ...reward, [field]: value } : reward
    );
    onChange(newRewards);
  };


  const rewardTypeOptions = [
    { value: 'CASH', label: '現金' },
    { value: 'POINTS', label: '點數' },
    { value: 'COUPON', label: '優惠券' },
    { value: 'ITEM', label: '道具' },
  ];

  return (
    <div className="space-y-4">

      {/* 獎勵表格 */}
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left border">天數</th>
              <th className="px-3 py-2 text-left border">獎勵類型</th>
              <th className="px-3 py-2 text-left border">金額</th>
              <th className="px-3 py-2 text-left border">備註</th>
            </tr>
          </thead>
          <tbody>
            {normalizedRewards.map((reward) => (
              <tr key={reward.dayIndex}>
                <td className="px-3 py-2 border font-medium">
                  第 {reward.dayIndex} 天
                </td>
                <td className="px-3 py-2 border">
                  <select
                    value={reward.rewardType}
                    onChange={(e) => updateReward(reward.dayIndex, 'rewardType', e.target.value)}
                    className="w-full px-2 py-1 border rounded"
                  >
                    {rewardTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 border">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={reward.amount || ''}
                    onChange={(e) => updateReward(reward.dayIndex, 'amount', parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full"
                  />
                </td>
                <td className="px-3 py-2 border">
                  <Input
                    value={reward.metaJson?.note || ''}
                    onChange={(e) => updateReward(reward.dayIndex, 'metaJson', { 
                      ...reward.metaJson, 
                      note: e.target.value 
                    })}
                    placeholder="備註"
                    className="w-full"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}