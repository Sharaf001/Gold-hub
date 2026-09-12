import { useRef } from 'react';
import { Link } from 'wouter';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Gem } from 'lucide-react';
import {
  useListFeaturedProducts,
  useListCategories,
} from '@workspace/api-client-react';
import ProductCard from '@/components/ProductCard';

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 200]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  const { data: featuredProducts, isLoading: loadingFeatured } = useListFeaturedProducts();
  const { data: categories, isLoading: loadingCategories } = useListCategories();

  return (
    <div className="grain-overlay bg-[hsl(24_8%_7%)] min-h-[100dvh]">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-[100dvh] flex items-center overflow-hidden">
        {/* Parallax background */}
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 z-0"
        >
          <div
            className="w-full h-full"
            style={{
              background: `
                radial-gradient(ellipse at 60% 40%, rgba(201, 168, 76, 0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 20% 80%, rgba(201, 168, 76, 0.05) 0%, transparent 50%),
                hsl(24 8% 7%)
              `,
            }}
          />
          <img
            src="/hero-jewelry.jpg"
            alt="AURUM Collection"
            className="absolute inset-0 w-full h-full object-cover opacity-25"
            style={{ objectPosition: 'center 30%' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(24_8%_7%/0.9)] via-[hsl(24_8%_7%/0.5)] to-transparent" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] w-12 bg-[rgba(201,168,76,0.5)]" />
              <span className="text-[10px] tracking-[0.35em] uppercase text-[hsl(43_45%_55%)] font-sans">Maison d'Or · Est. 1987</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-7xl md:text-8xl lg:text-[9rem] font-light leading-[0.9] tracking-tight text-[hsl(42_35%_88%)] mb-8 max-w-3xl"
          >
            Where Gold<br />
            <em className="not-italic text-gold">Becomes</em><br />
            Legacy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="font-sans text-[15px] font-light text-[hsl(42_25%_58%)] max-w-md leading-relaxed mb-10 tracking-wide"
          >
            Each piece is a singular act of creation. Forged from the finest 18K gold,
            set with stones chosen for their rarity, designed for those who understand
            that true luxury whispers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex items-center gap-6"
          >
            <Link href="/products" className="btn-gold px-8 py-4 inline-flex items-center gap-3" data-testid="link-explore-collection">
              Explore Collection
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/products?featured=true" className="btn-gold-outline px-8 py-4 inline-flex items-center gap-2" data-testid="link-new-arrivals">
              New Arrivals
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <div className="text-[9px] tracking-[0.3em] uppercase text-[hsl(38_15%_40%)]">Scroll</div>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-[1px] h-12 bg-gradient-to-b from-[rgba(201,168,76,0.5)] to-transparent"
          />
        </motion.div>
      </section>

      {/* Featured Products */}
      <section className="py-28 px-6 lg:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.4)]" />
            <Gem className="w-4 h-4 text-[hsl(43_45%_50%)]" />
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.4)]" />
          </div>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-[hsl(42_35%_88%)] tracking-tight mb-4">
            The Atelier Selection
          </h2>
          <p className="font-sans text-[13px] text-[hsl(38_15%_50%)] tracking-[0.08em] max-w-md mx-auto">
            Curated by our master jewellers. Each piece a statement of restraint and mastery.
          </p>
        </motion.div>

        {loadingFeatured ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-[hsl(24_8%_12%)] rounded-none" style={{ aspectRatio: '3/4' }} />
                <div className="mt-4 space-y-2">
                  <div className="h-2 bg-[hsl(24_8%_14%)] w-1/3" />
                  <div className="h-4 bg-[hsl(24_8%_14%)] w-2/3" />
                  <div className="h-3 bg-[hsl(24_8%_12%)] w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts && featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.slice(0, 8).map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif text-2xl text-[hsl(38_15%_40%)] font-light">
              The collection is being curated
            </p>
            <p className="text-[12px] tracking-[0.15em] uppercase text-[hsl(38_15%_35%)] mt-3">
              Return shortly
            </p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Link href="/products" className="btn-gold-outline px-10 py-4 inline-flex items-center gap-3" data-testid="link-view-all-products">
            View All Pieces
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="divider-gold" />
      </div>

      {/* Categories */}
      <section className="py-28 px-6 lg:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="text-[10px] tracking-[0.3em] uppercase text-[hsl(43_45%_50%)] block mb-3">By Category</span>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[hsl(42_35%_88%)]">
            The Houses
          </h2>
        </motion.div>

        {loadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-[hsl(24_8%_10%)] animate-pulse" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, index) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={`/products?categoryId=${cat.id}`}
                  className="group relative block overflow-hidden border border-[rgba(201,168,76,0.1)] hover:border-[rgba(201,168,76,0.3)] transition-all duration-500 p-8 md:p-10"
                  style={{ background: 'hsl(24 8% 10%)' }}
                  data-testid={`link-category-${cat.id}`}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%)',
                    }}
                  />
                  <span className="text-[10px] tracking-[0.25em] uppercase text-[hsl(43_35%_45%)] block mb-3">
                    House of
                  </span>
                  <h3 className="font-serif text-3xl font-light text-[hsl(42_35%_82%)] group-hover:text-[hsl(43_56%_68%)] transition-colors duration-300 mb-2">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-[12px] text-[hsl(38_15%_48%)] leading-relaxed mt-3 line-clamp-2">
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-6 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-[hsl(43_45%_50%)] group-hover:text-[hsl(43_56%_60%)] transition-colors">
                    Explore
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-xl text-[hsl(38_15%_40%)] font-light">Categories coming soon</p>
          </div>
        )}
      </section>

      {/* About / Brand story */}
      <section className="relative py-32 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent, hsl(24 8% 9%), transparent)',
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center"
        >
          <div>
            <img
              src="/about-store.jpg"
              alt="AURUM Atelier"
              className="w-full h-[500px] object-cover border border-[rgba(201,168,76,0.15)]"
            />
          </div>
          <div>
            <span className="text-[10px] tracking-[0.35em] uppercase text-[hsl(43_45%_50%)] block mb-6">Our Philosophy</span>
            <h2 className="font-serif text-5xl font-light text-[hsl(42_35%_88%)] leading-tight mb-8">
              Beauty that<br />
              <em className="not-italic text-gold">endures</em><br />
              generations
            </h2>
            <p className="font-sans text-[14px] text-[hsl(38_15%_55%)] leading-relaxed mb-6 tracking-wide">
              In 1987, Maison Aurum opened its private doors on the Rue de la Paix with a singular conviction: that jewellery at its highest form is not decoration but documentation — a record of who you are and what you hold precious.
            </p>
            <p className="font-sans text-[14px] text-[hsl(38_15%_50%)] leading-relaxed mb-10 tracking-wide">
              Every piece we create begins with a conversation. Our master jewellers spend days with a single stone before a sketch is drawn. The result is work that belongs to no trend and fears no era.
            </p>
            <div className="divider-gold mb-10" />
            <div className="grid grid-cols-3 gap-6">
              {[
                { value: '36', label: 'Years of Mastery' },
                { value: '2,400+', label: 'Pieces Created' },
                { value: '18K', label: 'Pure Gold Standard' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-serif text-3xl font-light text-[hsl(43_56%_60%)]">{stat.value}</div>
                  <div className="text-[10px] tracking-[0.15em] uppercase text-[hsl(38_15%_45%)] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Newsletter / CTA */}
      <section className="py-28 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[rgba(201,168,76,0.4)]" />
            <div className="w-1.5 h-1.5 bg-[hsl(43_56%_49%)] rotate-45" />
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[rgba(201,168,76,0.4)]" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-[hsl(42_35%_88%)] mb-4">
            Private Access
          </h2>
          <p className="font-sans text-[13px] text-[hsl(38_15%_50%)] tracking-wide mb-10">
            First knowledge of new commissions. Private viewings. Invitations to atelier events.
          </p>
          <div className="flex gap-0 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.2)] border-r-0 px-5 py-3.5 text-[13px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_38%)] focus:outline-none focus:border-[rgba(201,168,76,0.45)] transition-colors"
              data-testid="input-newsletter-email"
            />
            <button className="btn-gold px-6 py-3.5 whitespace-nowrap" data-testid="button-newsletter-subscribe">
              Request Access
            </button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(201,168,76,0.1)] py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="font-serif text-2xl tracking-[0.4em] text-[hsl(43_56%_60%)] font-light mb-2">AURUM</div>
              <div className="text-[9px] tracking-[0.3em] uppercase text-[hsl(38_15%_40%)] mb-4">Fine Jewellery · Est. 1987</div>
              <p className="text-[12px] text-[hsl(38_15%_45%)] leading-relaxed max-w-48">
                Private boutique. By appointment only.
              </p>
            </div>
            {[
              { title: 'Collections', links: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Bespoke'] },
              { title: 'Maison', links: ['Our Story', 'Craftsmanship', 'Materials', 'Commissions'] },
              { title: 'Service', links: ['Private Viewing', 'Care & Repair', 'Certification', 'Contact'] },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-[10px] tracking-[0.25em] uppercase text-[hsl(43_35%_45%)] mb-4">{col.title}</div>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="/products" className="text-[12px] text-[hsl(38_15%_48%)] hover:text-[hsl(43_45%_58%)] transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="divider-gold mb-8" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[11px] text-[hsl(38_15%_38%)] tracking-wide">
              © 2024 Maison Aurum. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              {['Privacy', 'Terms', 'Authenticity'].map((item) => (
                <span key={item} className="text-[11px] text-[hsl(38_15%_38%)] hover:text-[hsl(43_45%_50%)] cursor-pointer transition-colors tracking-wide">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
