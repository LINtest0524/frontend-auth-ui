// 統一導出所有型別定義

// 公司配置相關
export type {
  CompanyConfig,
  SoundEffectsConfig,
  LeaderboardConfig,
  LiveChatConfig,
  VIPSystemConfig,
  VIPLevel,
  VIPBenefit,
  TournamentConfig,
  PromotionConfig,
  AchievementConfig,
  GameCategory,
  TimeRange,
  ConfigValidationResult,
  ConfigVersion
} from './company.types';

// 頁面配置相關
export type {
  PageConfig,
  PageSection,
  UserRole,
  LayoutType,
  ComponentType,
  ModuleType,
  PageType,
  ResponsiveBreakpoints
} from './page.types';

export {
  ROLE_PERMISSIONS,
  DEFAULT_BREAKPOINTS
} from './page.types';

// 模組系統相關
export type {
  ModuleBase,
  ModuleDependency,
  ModuleConfig,
  ModuleLoadResult,
  ModuleRegistry,
  ModuleStatus,
  ModuleContract,
  ModuleContext,
  ModuleEvent,
  ModuleError,
  ModuleLoaderConfig,
  ModuleCache,
  SoundEffectsModule,
  LeaderboardModule,
  LiveChatModule,
  VIPSystemModule,
  TournamentModule,
  AchievementModule,
  ModuleFactory,
  ModuleManager,
  AvailableModules
} from './module.types';

export {
  DEFAULT_MODULES
} from './module.types';

// 主題系統相關
export type {
  ThemeConfig,
  ColorPalette,
  Typography,
  Spacing,
  Shadows,
  Borders,
  Animations,
  ComponentThemes,
  ButtonTheme,
  InputTheme,
  CardTheme,
  ModalTheme,
  NavbarTheme,
  SidebarTheme,
  FooterTheme,
  GameTheme,
  LeaderboardTheme,
  ThemeType,
  ThemeVariant,
  ThemeProviderConfig,
  ThemeContext
} from './theme.types';

export {
  DEFAULT_THEMES,
  CASINO_COLOR_SCHEMES
} from './theme.types';

// 用戶相關（現有）
export type { User } from './user';