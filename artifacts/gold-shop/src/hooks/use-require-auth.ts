import { useEffect } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export function useRequireAuth() {
  const [, setLocation] = useLocation();
  const { data: me, isLoading, isError } = useGetMe({
    query: { queryKey: getGetMeQueryKey(), retry: false },
  });

  useEffect(() => {
    if (isLoading) return;
    if (isError || !me) {
      setLocation("/login", { replace: true });
    }
  }, [isLoading, isError, me, setLocation]);

  const isAuthed = !isLoading && !isError && !!me;
  return { isChecking: isLoading || !isAuthed, isAuthed, me };
}