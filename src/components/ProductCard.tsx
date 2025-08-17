import { useRouter } from "next/navigation";
import '@/styles/components/product-card.css';

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  original_price?: number;
  short_description?: string;
  thumbnail?: string;
  is_featured: boolean;
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

  const hasDiscount = product.original_price && Number(product.original_price) > Number(product.price);

  const handleCardClick = () => {
    router.push(`/${companySlug}/products/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // 防止觸發卡片點擊
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <div className="product-card" onClick={handleCardClick}>
      {/* 商品圖片 */}
      <div className="product-image-container">
        {product.thumbnail ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE}${product.thumbnail}`}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="product-placeholder">
            📦
          </div>
        )}
        
        {/* 懸停購物車按鈕 */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            className="add-to-cart-btn"
            title="快速加入購物車"
          >
            🛒
          </button>
        )}
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
              ${Number(product.price).toFixed(0)}
            </span>
            {hasDiscount && (
              <span className="product-original-price">
                ${Number(product.original_price).toFixed(0)}
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