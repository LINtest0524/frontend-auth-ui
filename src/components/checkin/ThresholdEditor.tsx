"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ThresholdReward {
  rewardType: 'CASH' | 'POINTS' | 'COUPON' | 'ITEM';
  amount?: number;
  metaJson?: any;
}

interface Threshold {
  daysRequired: number;
  reward: ThresholdReward;
}

interface ThresholdEditorProps {
  thresholds: Threshold[];
  onChange: (thresholds: Threshold[]) => void;
}

export function ThresholdEditor({ thresholds, onChange }: ThresholdEditorProps) {
  const addThreshold = () => {
    const newThreshold: Threshold = {
      daysRequired: 1,
      reward: {
        rewardType: 'CASH',
        amount: 0,
        metaJson: {},
      },
    };
    onChange([...thresholds, newThreshold]);
  };

  const removeThreshold = (index: number) => {
    const newThresholds = thresholds.filter((_, i) => i !== index);
    onChange(newThresholds);
  };

  const updateThreshold = (index: number, field: keyof Threshold, value: any) => {
    const newThresholds = thresholds.map((threshold, i) =>
      i === index ? { ...threshold, [field]: value } : threshold
    );
    onChange(newThresholds);
  };

  const updateReward = (index: number, field: keyof ThresholdReward, value: any) => {
    const newThresholds = thresholds.map((threshold, i) =>
      i === index 
        ? { ...threshold, reward: { ...threshold.reward, [field]: value } }
        : threshold
    );
    onChange(newThresholds);
  };

  const rewardTypeOptions = [
    { value: 'CASH', label: '現金' },
    { value: 'POINTS', label: '點數' },
    { value: 'COUPON', label: '優惠券' },
    { value: 'ITEM', label: '道具' },
  ];

  // 排序門檻（按天數遞增）
  const sortedThresholds = [...thresholds].sort((a, b) => a.daysRequired - b.daysRequired);

  // 驗證重複天數
  const hasDuplicateDays = () => {
    const days = thresholds.map(t => t.daysRequired);
    return days.length !== new Set(days).size;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium">門檻獎勵設定</h4>
          <p className="text-sm text-gray-600">設定用戶達到指定天數時可獲得的獎勵</p>
        </div>
        <Button type="button" onClick={addThreshold}>
          新增門檻
        </Button>
      </div>

      {hasDuplicateDays() && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          警告：門檻天數不能重複
        </div>
      )}

      {thresholds.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          尚未設定門檻獎勵，點擊上方按鈕新增
        </div>
      ) : (
        <div className="space-y-3">
          {sortedThresholds.map((threshold, originalIndex) => {
            // 找到原始索引
            const realIndex = thresholds.findIndex(t => 
              t.daysRequired === threshold.daysRequired && 
              t.reward.rewardType === threshold.reward.rewardType
            );
            
            return (
              <div key={realIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div>
                    <Label>門檻天數</Label>
                    <Input
                      type="number"
                      min="1"
                      value={threshold.daysRequired}
                      onChange={(e) => updateThreshold(realIndex, 'daysRequired', parseInt(e.target.value) || 1)}
                      placeholder="天數"
                    />
                  </div>

                  <div>
                    <Label>獎勵類型</Label>
                    <select
                      value={threshold.reward.rewardType}
                      onChange={(e) => updateReward(realIndex, 'rewardType', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {rewardTypeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>金額</Label>
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      value={threshold.reward.amount || ''}
                      onChange={(e) => updateReward(realIndex, 'amount', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>備註</Label>
                    <Input
                      value={threshold.reward.metaJson?.note || ''}
                      onChange={(e) => updateReward(realIndex, 'metaJson', { 
                        ...threshold.reward.metaJson, 
                        note: e.target.value 
                      })}
                      placeholder="備註"
                    />
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeThreshold(realIndex)}
                      className="text-red-600 hover:text-red-700"
                    >
                      刪除
                    </Button>
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  用戶累積簽到達到 <span className="font-medium">{threshold.daysRequired}</span> 天時，
                  可獲得 <span className="font-medium">{rewardTypeOptions.find(opt => opt.value === threshold.reward.rewardType)?.label}</span>
                  {threshold.reward.amount ? ` ${threshold.reward.amount}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-2">注意事項：</p>
        <ul className="space-y-1">
          <li>• 門檻天數必須為正整數且不能重複</li>
          <li>• 建議按遞增順序設定門檻（如：3天、5天、7天）</li>
          <li>• 每個門檻只能領取一次</li>
          <li>• 連續檔次類型需要連續簽到才能達成門檻</li>
          <li>• 累積類型只要累積天數達到即可，不需連續</li>
        </ul>
      </div>
    </div>
  );
}