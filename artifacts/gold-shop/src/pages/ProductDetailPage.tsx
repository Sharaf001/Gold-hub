import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Award, Truck, ChevronDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetProduct,
  getGetProductQueryKey,
  useCreateOrder,
  getListOrdersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

const inquirySchema = z.object({
  customerName: z.string().min(2, 'Name required'),
  customerEmail: z.string().email('Valid email required'),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(5, 'Address required'),
  notes: z.string().optional(),
});

type InquiryForm = z.infer<typeof inquirySchema>;

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const [showInquiry, setShowInquiry] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: {
      enabled: !!productId,
      queryKey: getGetProductQueryKey(productId),
    },
  });

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: () => {
        toast({
          title: 'Enquiry Received',
          description: 'Our team will contact you within 24 hours.',
        });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setShowInquiry(false);
        form.reset();
      },
      onError: () => {
        toast({
          title: 'Something went wrong',
          description: 'Please try again or contact us directly.',
          variant: 'destructive',
        });
      },
    },
  });

  const form = useForm<InquiryForm>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      shippingAddress: '',
      notes: '',
    },
  });

  const onSubmit = (data: InquiryForm) => {
    if (!product) return;
    createOrder.mutate({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone || null,
        shippingAddress: data.shippingAddress,
        notes: data.notes || null,
        items: [{ productId: product.id, quantity: 1 }],
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-[hsl(24_8%_7%)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="font-serif text-2xl tracking-[0.4em] text-[hsl(43_56%_60%)] font-light animate-pulse">AURUM</div>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.5)] to-transparent animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-[100dvh] bg-[hsl(24_8%_7%)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-4xl text-[hsl(42_35%_70%)] font-light mb-4">Piece Not Found</h2>
          <Link href="/products" className="btn-gold-outline px-8 py-3 inline-block">
            Return to Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grain-overlay bg-[hsl(24_8%_7%)] min-h-[100dvh]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-28 pb-20">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <Link href="/products" className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[hsl(38_15%_48%)] hover:text-[hsl(43_45%_58%)] transition-colors" data-testid="link-back-to-products">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Collection
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 xl:gap-24">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div
              className="relative overflow-hidden border border-[rgba(201,168,76,0.15)]"
              style={{ aspectRatio: '4/5', background: 'hsl(24 8% 10%)' }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="img-product-detail"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center opacity-20">
                    <div className="w-24 h-24 mx-auto mb-4">
                      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M32 8L8 24L32 40L56 24L32 8Z" stroke="hsl(43 56% 49%)" strokeWidth="1" fill="none"/>
                        <path d="M8 24V40L32 56L56 40V24" stroke="hsl(43 56% 49%)" strokeWidth="1" fill="none"/>
                        <path d="M32 40V56" stroke="hsl(43 56% 49%)" strokeWidth="1"/>
                      </svg>
                    </div>
                    <span className="text-[11px] tracking-[0.3em] uppercase text-[hsl(38_15%_45%)] font-sans">Aurum</span>
                  </div>
                </div>
              )}
              {/* Gold corner accents */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t border-l border-[rgba(201,168,76,0.3)]" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t border-r border-[rgba(201,168,76,0.3)]" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b border-l border-[rgba(201,168,76,0.3)]" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b border-r border-[rgba(201,168,76,0.3)]" />
            </div>
          </motion.div>

          {/* Product details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            <div className="mb-3">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[hsl(43_35%_48%)]">
                {product.categoryName || 'Collection'}
              </span>
            </div>

            <h1
              className="font-serif text-4xl md:text-5xl font-light text-[hsl(42_35%_90%)] leading-tight mb-6"
              data-testid="text-product-name"
            >
              {product.name}
            </h1>

            <div className="divider-gold mb-8" />

            {/* Price */}
            <div className="mb-8">
              <span className="text-[10px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1">Price</span>
              <span
                className="font-serif text-3xl text-[hsl(43_56%_62%)] font-light"
                data-testid="text-product-price"
              >
                ${product.price}
              </span>
            </div>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {product.material && (
                <div className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-4">
                  <div className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_42%)] mb-1.5">Material</div>
                  <div className="text-[13px] text-[hsl(42_35%_78%)]" data-testid="text-product-material">{product.material}</div>
                </div>
              )}
              {product.weight && (
                <div className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-4">
                  <div className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_42%)] mb-1.5">Weight</div>
                  <div className="text-[13px] text-[hsl(42_35%_78%)]" data-testid="text-product-weight">{product.weight}</div>
                </div>
              )}
              <div className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-4">
                <div className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_42%)] mb-1.5">Availability</div>
                <div className={`text-[13px] ${product.inStock ? 'text-[hsl(140_35%_52%)]' : 'text-[hsl(43_45%_55%)]'}`}>
                  {product.inStock ? 'Available' : 'By Enquiry'}
                </div>
              </div>
              <div className="bg-[hsl(24_8%_10%)] border border-[rgba(201,168,76,0.1)] p-4">
                <div className="text-[9px] tracking-[0.25em] uppercase text-[hsl(38_15%_42%)] mb-1.5">Reference</div>
                <div className="text-[13px] text-[hsl(42_35%_78%)] font-mono">AUR-{String(product.id).padStart(4, '0')}</div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-10">
                <p className="text-[13px] text-[hsl(38_15%_55%)] leading-relaxed tracking-wide" data-testid="text-product-description">
                  {product.description}
                </p>
              </div>
            )}

            {/* CTA */}
            <div className="flex gap-4 mb-10">
              <button
                onClick={() => setShowInquiry(!showInquiry)}
                className="btn-gold flex-1 py-4 flex items-center justify-center gap-2"
                data-testid="button-inquire"
              >
                {product.inStock ? 'Enquire to Purchase' : 'Private Enquiry'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showInquiry ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Inquiry form */}
            {showInquiry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-10"
              >
                <div className="border border-[rgba(201,168,76,0.2)] p-6 bg-[hsl(24_8%_9%)]">
                  <h3 className="font-serif text-xl font-light text-[hsl(43_56%_62%)] mb-6">Private Enquiry</h3>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Full Name *</label>
                        <input
                          {...form.register('customerName')}
                          className="w-full bg-[hsl(24_8%_11%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
                          placeholder="Your name"
                          data-testid="input-inquiry-name"
                        />
                        {form.formState.errors.customerName && (
                          <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.customerName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Email *</label>
                        <input
                          {...form.register('customerEmail')}
                          type="email"
                          className="w-full bg-[hsl(24_8%_11%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
                          placeholder="your@email.com"
                          data-testid="input-inquiry-email"
                        />
                        {form.formState.errors.customerEmail && (
                          <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.customerEmail.message}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Phone</label>
                      <input
                        {...form.register('customerPhone')}
                        className="w-full bg-[hsl(24_8%_11%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
                        placeholder="+1 (555) 000-0000"
                        data-testid="input-inquiry-phone"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Shipping Address *</label>
                      <input
                        {...form.register('shippingAddress')}
                        className="w-full bg-[hsl(24_8%_11%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors"
                        placeholder="Your delivery address"
                        data-testid="input-inquiry-address"
                      />
                      {form.formState.errors.shippingAddress && (
                        <p className="text-[10px] text-[hsl(0_55%_55%)] mt-1">{form.formState.errors.shippingAddress.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-[9px] tracking-[0.2em] uppercase text-[hsl(38_15%_45%)] block mb-1.5">Notes</label>
                      <textarea
                        {...form.register('notes')}
                        rows={3}
                        className="w-full bg-[hsl(24_8%_11%)] border border-[rgba(201,168,76,0.15)] px-3 py-2.5 text-[12px] text-[hsl(42_35%_78%)] placeholder:text-[hsl(38_15%_35%)] focus:outline-none focus:border-[rgba(201,168,76,0.4)] transition-colors resize-none"
                        placeholder="Any special requirements or questions..."
                        data-testid="input-inquiry-notes"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={createOrder.isPending}
                      className="btn-gold w-full py-3.5 disabled:opacity-50"
                      data-testid="button-submit-inquiry"
                    >
                      {createOrder.isPending ? 'Sending...' : 'Submit Private Enquiry'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Trust signals */}
            <div className="divider-gold mb-8" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: 'Certificate of Authenticity' },
                { icon: Award, label: 'Lifetime Guarantee' },
                { icon: Truck, label: 'Insured Delivery' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="text-center">
                  <Icon className="w-5 h-5 text-[hsl(43_45%_50%)] mx-auto mb-2 opacity-70" />
                  <div className="text-[9px] tracking-[0.12em] uppercase text-[hsl(38_15%_45%)] leading-tight">{label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
