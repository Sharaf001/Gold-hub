import { z } from "zod";

export const HealthStatus = z.object({
  status: z.string(),
});

export const ErrorResponse = z.object({
  error: z.string(),
});

export const MessageResponse = z.object({
  message: z.string(),
});

export const AuthUser = z.object({
  id: z.number(),
  username: z.string(),
  role: z.string(),
  address: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  emailVerified: z.boolean().optional(),
});

export const Category = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const Product = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  price: z.string(),
  costPrice: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  categoryId: z.number(),
  categoryName: z.string().nullable().optional(),
  inStock: z.boolean(),
  featured: z.boolean(),
  createdAt: z.string(),
});

export const OrderItem = z.object({
  id: z.number(),
  productId: z.number().nullable(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.string(),
  imageUrl: z.string().nullable().optional(),
});

export const Order = z.object({
  id: z.number(),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  totalAmount: z.string(),
  status: z.string(),
  archived: z.boolean(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  items: z.array(OrderItem).optional(),
});

export const CategoryCount = z.object({
  categoryName: z.string(),
  count: z.number(),
});

export const AdminStats = z.object({
  totalProducts: z.number(),
  totalOrders: z.number(),
  totalRevenue: z.string(),
  totalProfit: z.string(),
  recentProfit: z.string(),
  pendingOrders: z.number(),
  lowStockProducts: z.number(),
  recentOrdersCount: z.number(),
  categoryCounts: z.array(CategoryCount),
});

export const HealthCheckResponse = HealthStatus;

export const LoginBody = z.object({
  username: z.string(),
  password: z.string(),
});
export const LoginResponse = AuthUser;
export const GetMeResponse = AuthUser;

export const RegisterBody = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["user", "admin"]).optional().default("user"),
  adminCode: z.string().optional(),
});
export const RegisterResponse = z.object({
  pendingVerification: z.literal(true),
  email: z.string(),
});

export const UpdateProfileBody = z.object({
  address: z.string().nullable().optional(),
});
export const UpdateProfileResponse = AuthUser;

export const GoogleAuthBody = z.object({
  idToken: z.string(),
});
export const GoogleAuthResponse = AuthUser;

export const VerifyCodeBody = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});
export const VerifyCodeResponse = AuthUser;

export const ResendVerificationBody = z.object({
  email: z.string().email(),
});
export const ResendVerificationResponse = MessageResponse;

export const ListCategoriesResponse = z.array(Category);

export const CreateCategoryBody = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
});
export const CreateCategoryResponse = Category;

export const DeleteCategoryParams = z.object({ id: z.number() });
export const DeleteCategoryResponse = MessageResponse;

export const ListProductsQueryParams = z.object({
  categoryId: z.number().nullable().optional(),
  featured: z.boolean().nullable().optional(),
  search: z.string().nullable().optional(),
});
export const ListProductsResponse = z.array(Product);
export const ListFeaturedProductsResponse = z.array(Product);

export const CreateProductBody = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  price: z.string(),
  costPrice: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  categoryId: z.number(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export const CreateProductResponse = Product;

export const GetProductParams = z.object({ id: z.number() });
export const GetProductResponse = Product;

export const UpdateProductParams = z.object({ id: z.number() });
export const UpdateProductBody = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  price: z.string().optional(),
  costPrice: z.string().nullable().optional(),
  material: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  categoryId: z.number().optional(),
  inStock: z.boolean().optional(),
  featured: z.boolean().optional(),
});
export const UpdateProductResponse = Product;

export const DeleteProductParams = z.object({ id: z.number() });
export const DeleteProductResponse = MessageResponse;

export const ListOrdersResponse = z.array(Order);
export const ListMyOrdersResponse = z.array(Order);
export const ClearOrdersResponse = MessageResponse;

export const OrderItemInput = z.object({
  productId: z.number(),
  quantity: z.number(),
});
export const CreateOrderBody = z.object({
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(OrderItemInput),
});
export const CreateOrderResponse = Order;

export const GetOrderParams = z.object({ id: z.number() });
export const GetOrderResponse = Order;

export const UpdateOrderStatusParams = z.object({ id: z.number() });
export const UpdateOrderStatusBody = z.object({
  status: z.string(),
  notes: z.string().nullable().optional(),
});
export const UpdateOrderStatusResponse = Order;

export const ArchiveOrderParams = z.object({ id: z.number() });
export const ArchiveOrderResponse = Order;

export const GetAdminStatsResponse = AdminStats;
export const ResetRevenueResponse = MessageResponse;
export const ResetProfitResponse = MessageResponse;