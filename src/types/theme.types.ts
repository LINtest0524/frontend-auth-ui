// 主題系統型別定義

// 主題配置
export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  borders: Borders;
  animations: Animations;
  components: ComponentThemes;
  customCSS?: string;
}

// 色彩調色盤
export interface ColorPalette {
  // 主要顏色
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // 主色
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // 次要顏色
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // 次要色
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // 強調色
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // 強調色
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // 灰階
  gray: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  
  // 語意化顏色
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  
  // 背景色
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  
  // 文字色
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  // 邊框色
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
}

// 字體排版
export interface Typography {
  fontFamily: {
    primary: string;
    secondary: string;
    mono: string;
  };
  
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

// 間距系統
export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

// 陰影系統
export interface Shadows {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

// 邊框系統
export interface Borders {
  width: {
    0: string;
    1: string;
    2: string;
    4: string;
    8: string;
  };
  
  radius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  
  style: {
    solid: string;
    dashed: string;
    dotted: string;
    double: string;
    none: string;
  };
}

// 動畫系統
export interface Animations {
  duration: {
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
  };
  
  easing: {
    linear: string;
    in: string;
    out: string;
    inOut: string;
  };
  
  keyframes: {
    fadeIn: string;
    fadeOut: string;
    slideIn: string;
    slideOut: string;
    bounce: string;
    pulse: string;
    spin: string;
  };
}

// 元件主題
export interface ComponentThemes {
  button: ButtonTheme;
  input: InputTheme;
  card: CardTheme;
  modal: ModalTheme;
  navbar: NavbarTheme;
  sidebar: SidebarTheme;
  footer: FooterTheme;
  game: GameTheme;
  leaderboard: LeaderboardTheme;
}

// 按鈕主題
export interface ButtonTheme {
  base: string;
  variants: {
    primary: string;
    secondary: string;
    accent: string;
    danger: string;
    ghost: string;
    outline: string;
  };
  sizes: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  states: {
    hover: string;
    active: string;
    disabled: string;
    loading: string;
  };
}

// 輸入框主題
export interface InputTheme {
  base: string;
  variants: {
    default: string;
    error: string;
    success: string;
  };
  sizes: {
    sm: string;
    md: string;
    lg: string;
  };
  states: {
    focus: string;
    disabled: string;
  };
}

// 卡片主題
export interface CardTheme {
  base: string;
  variants: {
    default: string;
    elevated: string;
    outlined: string;
    filled: string;
  };
  hover: string;
}

// 模態框主題
export interface ModalTheme {
  overlay: string;
  container: string;
  content: string;
  header: string;
  body: string;
  footer: string;
  closeButton: string;
}

// 導航欄主題
export interface NavbarTheme {
  container: string;
  brand: string;
  menu: string;
  item: string;
  activeItem: string;
  dropdown: string;
  mobile: string;
}

// 側邊欄主題
export interface SidebarTheme {
  container: string;
  header: string;
  menu: string;
  item: string;
  activeItem: string;
  subMenu: string;
  footer: string;
  collapsed: string;
}

// 頁腳主題
export interface FooterTheme {
  container: string;
  section: string;
  title: string;
  link: string;
  copyright: string;
  social: string;
}

// 遊戲相關主題
export interface GameTheme {
  card: string;
  thumbnail: string;
  title: string;
  category: string;
  playButton: string;
  favoriteButton: string;
  jackpot: string;
  newBadge: string;
  hotBadge: string;
}

// 排行榜主題
export interface LeaderboardTheme {
  container: string;
  header: string;
  item: string;
  rank: string;
  avatar: string;
  username: string;
  score: string;
  prize: string;
  topThree: {
    first: string;
    second: string;
    third: string;
  };
}

// 主題類型
export type ThemeType = 
  | 'classic'
  | 'modern' 
  | 'luxury'
  | 'dark'
  | 'light'
  | 'custom';

// 主題變體
export interface ThemeVariant {
  id: string;
  name: string;
  baseTheme: ThemeType;
  overrides: Partial<ThemeConfig>;
}

// 主題提供者配置
export interface ThemeProviderConfig {
  defaultTheme: ThemeType;
  themes: Record<ThemeType, ThemeConfig>;
  variants: ThemeVariant[];
  enableDynamicLoading: boolean;
  enableCustomCSS: boolean;
  cssVariablePrefix: string;
}

// 主題上下文
export interface ThemeContext {
  currentTheme: ThemeType;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  applyVariant: (variantId: string) => void;
  resetTheme: () => void;
}

// 預設主題
export const DEFAULT_THEMES: ThemeType[] = [
  'classic',
  'modern',
  'luxury',
  'dark',
  'light'
];

// 娛樂城特定主題配色
export const CASINO_COLOR_SCHEMES = {
  CLASSIC: {
    primary: '#1a202c',
    secondary: '#2d3748',
    accent: '#f6e05e',
    background: '#1a1a1a',
    text: '#ffffff'
  },
  
  LUXURY: {
    primary: '#744210',
    secondary: '#975a16',
    accent: '#ffd700',
    background: '#0f0f0f',
    text: '#f7fafc'
  },
  
  MODERN: {
    primary: '#2b6cb0',
    secondary: '#3182ce',
    accent: '#63b3ed',
    background: '#f7fafc',
    text: '#2d3748'
  }
} as const;