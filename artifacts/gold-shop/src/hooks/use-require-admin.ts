import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function useRequireAdmin() {
  const [, setLocation] = useLocation();
  const { data: me, isLoading, isError } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  useEffect(() => {
    if (isLoading) return;
    if (isError || !me || me.role !== "admin") {
      setLocation("/login", { replace: true });
    }
  }, [isLoading, isError, me, setLocation]);

  const isAdmin = !isLoading && !isError && me?.role === "admin";
  return { isChecking: isLoading || !isAdmin, isAdmin };
}