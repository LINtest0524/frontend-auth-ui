import { useRouter } from "next/navigation";

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

  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

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
    <div
      className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={handleCardClick}
    >
      {/* 商品圖片 */}
      <div className="relative overflow-hidden">
        {product.thumbnail ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_BASE}${product.thumbnail}`}
            alt={product.name}
            className="w-full h-48 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
            <span className="text-4xl">📦</span>
          </div>
        )}
        
        {/* 標籤 */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_featured && (
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              精選
            </span>
          )}
          
          {hasDiscount && (
            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* 快速加入購物車按鈕 */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 bg-orange-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-orange-600"
            title="加入購物車"
          >
            🛒
          </button>
        )}
      </div>
      
      {/* 商品資訊 */}
      <div className="p-4">
        <h3 className="font-medium text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        {product.short_description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}
        
        {/* 價格 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-red-600">
              ${product.price}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ${product.original_price}
              </span>
            )}
          </div>
        </div>
        
        {/* 分類和SKU */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          {product.category && (
            <span className="bg-gray-100 px-2 py-1 rounded">
              {product.category.name}
            </span>
          )}
          <span className="font-mono">
            {product.sku}
          </span>
        </div>
      </div>
    </div>
  );
}