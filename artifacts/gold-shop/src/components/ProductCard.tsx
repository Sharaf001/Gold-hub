import { Link } from 'wouter';
import { motion } from 'framer-motion';
import type { Product } from '@workspace/api-client-react';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: 'easeOut' }}
    >
      <Link
        href={`/products/${product.id}`}
        className="group block product-card-shimmer"
        data-testid={`card-product-${product.id}`}
      >
        {/* Image container */}
        <div className="relative overflow-hidden bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] group-hover:border-[rgba(201,168,76,0.3)] transition-all duration-500" style={{ aspectRatio: '3/4' }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 opacity-20">
                  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 8L8 24L32 40L56 24L32 8Z" stroke="hsl(43 56% 49%)" strokeWidth="1.5" fill="none"/>
                    <path d="M8 24V40L32 56L56 40V24" stroke="hsl(43 56% 49%)" strokeWidth="1.5" fill="none"/>
                    <path d="M32 40V56" stroke="hsl(43 56% 49%)" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[hsl(38_15%_40%)]">Aurum</span>
              </div>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(24_8%_7%/0.6)] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {product.featured && (
              <span className="text-[9px] tracking-[0.2em] uppercase bg-[hsl(43_56%_49%)] text-[hsl(24_8%_7%)] px-2.5 py-1 font-medium">
                Featured
              </span>
            )}
            {!product.inStock && (
              <span className="text-[9px] tracking-[0.2em] uppercase bg-[hsl(24_8%_7%/0.8)] text-[hsl(38_15%_55%)] border border-[rgba(201,168,76,0.2)] px-2.5 py-1">
                Enquire
              </span>
            )}
          </div>

          {/* Quick view on hover */}
          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="btn-gold-outline text-center py-2.5 px-4 backdrop-blur-sm bg-[hsl(24_8%_7%/0.7)]">
              View Piece
            </div>
          </div>
        </div>

        {/* Product info */}
        <div className="mt-4 px-0.5">
          <div className="text-[9px] tracking-[0.25em] uppercase text-[hsl(43_35%_45%)] mb-1.5 font-sans">
            {product.categoryName || 'Collection'} {product.material ? `· ${product.material}` : ''}
          </div>
          <h3 className="font-serif text-lg font-light text-[hsl(42_35%_88%)] group-hover:text-[hsl(43_56%_68%)] transition-colors duration-300 leading-tight">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-serif text-base text-[hsl(43_50%_60%)] font-light">
              ${product.price}
            </span>
            {product.weight && (
              <span className="text-[10px] text-[hsl(38_15%_45%)]">{product.weight}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
