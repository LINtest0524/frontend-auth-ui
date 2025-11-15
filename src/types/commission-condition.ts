export enum CommissionMethod {
  SETTLEMENT_ACTIVE_MEMBERS = 'SETTLEMENT_ACTIVE_MEMBERS',
  SETTLEMENT_ECPAY_PERSON = 'SETTLEMENT_ECPAY_PERSON',
}

export interface PlatformRefundRate {
  id?: string;
  platformCode: string;
  refundPercent: string | number;
  conditionGroupId?: string;
}

export interface FixedCost {
  id?: string;
  feeDeposit: string | number;
  feeWithdraw: string | number;
  refundBudgetPercent: string | number;
  promoBudgetPercent: string | number;
  bonusBudgetPercent: string | number;
  conditionGroupId?: string;
}

export interface ConditionGroup {
  id?: string;
  // 門檻條件
  minRegistrations: number;
  minActiveMembers: number;
  minValidBets: number;
  minNetRevenue: string | number;
  requireNegativeProfit: boolean;
  // 結果設定
  sharePercent: string | number;
  agentRemitPercent: string | number;
  // 排序
  order: number;
  // 關聯
  commissionConditionId?: string;
  platformRefundRates?: PlatformRefundRate[];
  fixedCost?: FixedCost;
}

export interface CommissionCondition {
  id?: string;
  name: string;
  method: CommissionMethod;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  companyId?: number;
  agentId: number;
  agentName?: string;
  groupCount?: number;
  createdAt?: string;
  updatedAt?: string;
  groups?: ConditionGroup[];
}

export interface CommissionConditionListItem {
  id: string;
  name: string;
  agentId: string;
  agentName: string;
  method: CommissionMethod;
  isActive: boolean;
  systemType?: string;
  agentLevel?: string;
  commissionPercent?: number;
  gameRebateRates?: Record<string, number>;
  settlementCycle?: string;
  groupCount: number;
  updatedAt: string;
}

export interface CommissionConditionQuery {
  page?: number;
  limit?: number;
  commissionPercentMin?: number;
  commissionPercentMax?: number;
  settlementCycle?: string;
  systemType?: string;
}

export interface CommissionConditionListResponse {
  items: CommissionConditionListItem[];
  total: number;
  page: number;
  limit: number;
}

// 表單用的 DTO
export interface CreateCommissionConditionDto {
  name: string;
  agentId: number;
  method: CommissionMethod;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  groups: CreateConditionGroupDto[];
}

export interface CreateConditionGroupDto {
  minRegistrations?: number;
  minActiveMembers?: number;
  minValidBets?: number;
  minNetRevenue?: number;
  requireNegativeProfit?: boolean;
  sharePercent: number;
  agentRemitPercent: number;
  platformRefundRates?: CreatePlatformRefundRateDto[];
  fixedCost?: CreateFixedCostDto;
}

export interface CreatePlatformRefundRateDto {
  platformCode: string;
  refundPercent: number;
}

export interface CreateFixedCostDto {
  feeDeposit?: number;
  feeWithdraw?: number;
  refundBudgetPercent?: number;
  promoBudgetPercent?: number;
  bonusBudgetPercent?: number;
}

export interface UpdateCommissionConditionDto extends Partial<CreateCommissionConditionDto> {}

// 平台清單已遷移到字典API，請使用 usePlatformDictionary() Hook
// 如需向後兼容，可以從字典API取得平台代碼列表