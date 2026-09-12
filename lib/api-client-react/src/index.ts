import {
  useQuery,
  useMutation,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { z } from "zod";
import * as schemas from "@workspace/api-zod";
import { request, buildQuery, ApiError } from "./http";
export { ApiError } from "./http";

export type Category = z.infer<typeof schemas.Category>;
export type Product = z.infer<typeof schemas.Product>;
export type Order = z.infer<typeof schemas.Order>;
export type OrderItem = z.infer<typeof schemas.OrderItem>;
export type AdminStats = z.infer<typeof schemas.AdminStats>;
export type AuthUser = z.infer<typeof schemas.AuthUser>;

type ListProductsParams = z.infer<typeof schemas.ListProductsQueryParams>;

function useApiQuery<T>(
  defaultKey: QueryKey,
  fn: () => Promise<T>,
  options?: { query?: Partial<UseQueryOptions<T>> },
) {
  return useQuery<T>({
    queryKey: defaultKey,
    queryFn: fn,
    ...options?.query,
  });
}

function useApiMutation<TData, TVars>(
  fn: (vars: TVars) => Promise<TData>,
  options?: { mutation?: UseMutationOptions<TData, Error, TVars> },
) {
  return useMutation<TData, Error, TVars>({
    mutationFn: fn,
    ...options?.mutation,
  });
}

export function getHealthCheckQueryKey(): QueryKey {
  return ["health"];
}
export function useHealthCheck(options?: {
  query?: Partial<UseQueryOptions<z.infer<typeof schemas.HealthCheckResponse>>>;
}) {
  return useApiQuery(
    getHealthCheckQueryKey(),
    () => request("/healthz").then((r) => schemas.HealthCheckResponse.parse(r)),
    options,
  );
}

export function getGetMeQueryKey(): QueryKey {
  return ["auth", "me"];
}
export function useGetMe(options?: {
  query?: Partial<UseQueryOptions<AuthUser>>;
}) {
  return useApiQuery(
    getGetMeQueryKey(),
    () => request<AuthUser>("/auth/me"),
    options,
  );
}

export function useUpdateProfile(options?: {
  mutation?: UseMutationOptions<AuthUser, Error, { data: { address?: string | null } }>;
}) {
  return useApiMutation<AuthUser, { data: { address?: string | null } }>(
    ({ data }) =>
      request<AuthUser>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    options,
  );
}

export function useLogin(options?: {
  mutation?: UseMutationOptions<AuthUser, Error, { data: { username: string; password: string } }>;
}) {
  return useApiMutation<AuthUser, { data: { username: string; password: string } }>(
    ({ data }) =>
      request<AuthUser>("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    options,
  );
}

type RegisterInput = { username: string; email: string; password: string; role?: "user" | "admin"; adminCode?: string };
type RegisterResult = { pendingVerification: true; email: string };

export function useRegister(options?: {
  mutation?: UseMutationOptions<RegisterResult, Error, { data: RegisterInput }>;
}) {
  return useApiMutation<RegisterResult, { data: RegisterInput }>(
    ({ data }) =>
      request<RegisterResult>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    options,
  );
}

export function useGoogleAuth(options?: {
  mutation?: UseMutationOptions<AuthUser, Error, { data: { idToken: string } }>;
}) {
  return useApiMutation<AuthUser, { data: { idToken: string } }>(
    ({ data }) =>
      request<AuthUser>("/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    options,
  );
}

export function useVerifyCode(options?: {
  mutation?: UseMutationOptions<AuthUser, Error, { data: { email: string; code: string } }>;
}) {
  return useApiMutation<AuthUser, { data: { email: string; code: string } }>(
    ({ data }) =>
      request<AuthUser>("/auth/verify-code", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    options,
  );
}

export function useResendVerification(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, { data: { email: string } }>;
}) {
  return useApiMutation<{ message: string }, { data: { email: string } }>(
    ({ data }) => request("/auth/resend-verification", { method: "POST", body: JSON.stringify(data) }),
    options,
  );
}

export function useLogout(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, Record<string, never>>;
}) {
  return useApiMutation<{ message: string }, Record<string, never>>(
    () => request("/auth/logout", { method: "POST" }),
    options,
  );
}

export function getListCategoriesQueryKey(): QueryKey {
  return ["categories"];
}
export function useListCategories(options?: {
  query?: Partial<UseQueryOptions<Category[]>>;
}) {
  return useApiQuery(
    getListCategoriesQueryKey(),
    () => request<Category[]>("/categories"),
    options,
  );
}

export function useCreateCategory(options?: {
  mutation?: UseMutationOptions<Category, Error, { data: { name: string; slug: string; description?: string | null } }>;
}) {
  return useApiMutation<Category, { data: { name: string; slug: string; description?: string | null } }>(
    ({ data }) =>
      request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
    options,
  );
}

export function useDeleteCategory(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, { id: number }>;
}) {
  return useApiMutation<{ message: string }, { id: number }>(
    ({ id }) => request(`/categories/${id}`, { method: "DELETE" }),
    options,
  );
}

export function getListProductsQueryKey(params?: ListProductsParams): QueryKey {
  return ["products", params ?? {}];
}
export function useListProducts(
  params?: ListProductsParams,
  options?: { query?: Partial<UseQueryOptions<Product[]>> },
) {
  return useApiQuery(
    getListProductsQueryKey(params),
    () => request<Product[]>(`/products${buildQuery(params ?? {})}`),
    options,
  );
}

export function getListFeaturedProductsQueryKey(): QueryKey {
  return ["products", "featured"];
}
export function useListFeaturedProducts(options?: {
  query?: Partial<UseQueryOptions<Product[]>>;
}) {
  return useApiQuery(
    getListFeaturedProductsQueryKey(),
    () => request<Product[]>("/products/featured"),
    options,
  );
}

export function getGetProductQueryKey(id: number): QueryKey {
  return ["products", id];
}
export function useGetProduct(
  id: number,
  options?: { query?: Partial<UseQueryOptions<Product>> },
) {
  return useApiQuery(
    getGetProductQueryKey(id),
    () => request<Product>(`/products/${id}`),
    options,
  );
}

type ProductInput = Omit<Product, "id" | "createdAt" | "categoryName">;

export function useCreateProduct(options?: {
  mutation?: UseMutationOptions<Product, Error, { data: ProductInput }>;
}) {
  return useApiMutation<Product, { data: ProductInput }>(
    ({ data }) => request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
    options,
  );
}

export function useUpdateProduct(options?: {
  mutation?: UseMutationOptions<Product, Error, { id: number; data: Partial<ProductInput> }>;
}) {
  return useApiMutation<Product, { id: number; data: Partial<ProductInput> }>(
    ({ id, data }) =>
      request<Product>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    options,
  );
}

export function useDeleteProduct(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, { id: number }>;
}) {
  return useApiMutation<{ message: string }, { id: number }>(
    ({ id }) => request(`/products/${id}`, { method: "DELETE" }),
    options,
  );
}

export function getListOrdersQueryKey(): QueryKey {
  return ["orders"];
}
export function useListOrders(options?: {
  query?: Partial<UseQueryOptions<Order[]>>;
}) {
  return useApiQuery(getListOrdersQueryKey(), () => request<Order[]>("/orders"), options);
}

export function getListMyOrdersQueryKey(): QueryKey {
  return ["orders", "mine"];
}
export function useListMyOrders(options?: {
  query?: Partial<UseQueryOptions<Order[]>>;
}) {
  return useApiQuery(getListMyOrdersQueryKey(), () => request<Order[]>("/orders/mine"), options);
}

export function useClearOrders(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, Record<string, never>>;
}) {
  return useApiMutation<{ message: string }, Record<string, never>>(
    () => request("/orders", { method: "DELETE" }),
    options,
  );
}

type OrderInput = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  notes?: string | null;
  items: { productId: number; quantity: number }[];
};

export function useCreateOrder(options?: {
  mutation?: UseMutationOptions<Order, Error, { data: OrderInput }>;
}) {
  return useApiMutation<Order, { data: OrderInput }>(
    ({ data }) => request<Order>("/orders", { method: "POST", body: JSON.stringify(data) }),
    options,
  );
}

export function getGetOrderQueryKey(id: number): QueryKey {
  return ["orders", id];
}
export function useGetOrder(
  id: number,
  options?: { query?: Partial<UseQueryOptions<Order>> },
) {
  return useApiQuery(getGetOrderQueryKey(id), () => request<Order>(`/orders/${id}`), options);
}

export function useUpdateOrderStatus(options?: {
  mutation?: UseMutationOptions<Order, Error, { id: number; data: { status: string; notes?: string | null } }>;
}) {
  return useApiMutation<Order, { id: number; data: { status: string; notes?: string | null } }>(
    ({ id, data }) =>
      request<Order>(`/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    options,
  );
}

export function useArchiveOrder(options?: {
  mutation?: UseMutationOptions<Order, Error, { id: number }>;
}) {
  return useApiMutation<Order, { id: number }>(
    ({ id }) => request<Order>(`/orders/${id}/archive`, { method: "PATCH" }),
    options,
  );
}

export function getGetAdminStatsQueryKey(): QueryKey {
  return ["admin", "stats"];
}
export function useGetAdminStats(options?: {
  query?: Partial<UseQueryOptions<AdminStats>>;
}) {
  return useApiQuery(getGetAdminStatsQueryKey(), () => request<AdminStats>("/admin/stats"), options);
}

export function useResetRevenue(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, Record<string, never>>;
}) {
  return useApiMutation<{ message: string }, Record<string, never>>(
    () => request("/admin/reset-revenue", { method: "POST" }),
    options,
  );
}

export function useResetProfit(options?: {
  mutation?: UseMutationOptions<{ message: string }, Error, Record<string, never>>;
}) {
  return useApiMutation<{ message: string }, Record<string, never>>(
    () => request("/admin/reset-profit", { method: "POST" }),
    options,
  );
}