import { useRouter, useSearchParams } from "next/navigation";
import { useCompanyConfig, useThemeConfig } from '@/hooks/useCompanyConfig';
import '@/styles/components/product-card.css';

interface ProductVariant {
  id: number;
  variant_name: string;
  sku: string;
  price: number;
  original_price?: number;
  stock_quantity: number;
  images?: string[];
  is_default: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  original_price?: number;
  short_description?: string;
  thumbnail?: string;
  is_featured: boolean;
  variants?: ProductVariant[];
  category?: {
    id: number;
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
  companySlug: string;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, companySlug, onAddToCart }: ProductCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 🚀 配置系統整合
  const { config } = useCompanyConfig(companySlug);
  const themeConfig = useThemeConfig(config);

  // 獲取顯示用的價格和圖片
  const getDisplayData = () => {
    // 如果有變體，使用預設變體或第一個變體的資料
    if (product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.is_default) || product.variants[0];
      return {
        price: defaultVariant.price,
        original_price: defaultVariant.original_price,
        thumbnail: defaultVariant.images && defaultVariant.images.length > 0 
          ? defaultVariant.images[0] 
          : product.thumbnail,
        hasVariants: true
      };
    }
    
    // 沒有變體，使用主商品資料
    return {
      price: product.price,
      original_price: product.original_price,
      thumbnail: product.thumbnail,
      hasVariants: false
    };
  };

  const displayData = getDisplayData();
  const hasDiscount = displayData.original_price && Number(displayData.original_price) > Number(displayData.price);

  const handleCardClick = () => {
    // 保持原有的查詢參數（如 agent 參數）
    const currentParams = new URLSearchParams(searchParams.toString());
    const queryString = currentParams.toString();
    const productUrl = `/${companySlug}/products/${product.id}${queryString ? `?${queryString}` : ''}`;
    router.push(productUrl);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發卡片點擊
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  // 🎨 動態主題樣式
  const getCardStyle = () => {
    if (!themeConfig) return {};
    
    return {
      '--primary-color': themeConfig.colors.primary,
      '--secondary-color': themeConfig.colors.secondary,
      '--accent-color': themeConfig.colors.accent,
      '--hover-border-color': themeConfig.colors.primary,
      '--button-gradient': `linear-gradient(135deg, ${themeConfig.colors.primary} 0%, ${themeConfig.colors.secondary} 100%)`,
      '--price-gradient': `linear-gradient(135deg, ${themeConfig.colors.accent} 0%, ${themeConfig.colors.primary} 100%)`,
    } as React.CSSProperties;
  };

  return (
    <div 
      className="product-card" 
      onClick={handleCardClick}
      style={getCardStyle()}
      data-theme={config?.branding?.theme || 'default'}
      data-company={companySlug}
    >
      {/* 商品圖片 */}
      <div className="product-image-container">
        {displayData.thumbnail ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE}${displayData.thumbnail}`}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="product-placeholder">
            📦
          </div>
        )}
        
        {/* 移除懸停購物車按鈕，因為商品需要先選擇規格 */}
      </div>
      
      {/* 商品資訊 */}
      <div className="product-content">
        <h3 className="product-title">
          {product.name}
        </h3>
        
        {product.short_description && (
          <p className="product-description">
            {product.short_description}
          </p>
        )}
        
        {/* 價格區域 */}
        <div className="product-price-section">
          <div className="product-price-container">
            <span className="product-price">
              ${Number(displayData.price).toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="product-original-price">
                ${Number(displayData.original_price).toFixed(0)}
              </span>
            )}
          </div>
          
          {/* 購物車按鈕 */}
          {onAddToCart && (
            <button
              onClick={handleAddToCart}
              className="product-cart-button"
            >
              <span>🛒</span>
              加入購物車
            </button>
          )}
        </div>
      </div>
    </div>
  );
}