import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetMe, getGetMeQueryKey } from '@workspace/api-client-react';
import AdminLayout from './AdminLayout';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [, setLocation] = useLocation();
  const { data: me, isLoading, isError } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  useEffect(() => {
    if (!isLoading && (isError || !me)) {
      setLocation('/login');
    }
  }, [isLoading, isError, me, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[hsl(24_8%_7%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="font-serif text-2xl tracking-[0.4em] text-[hsl(43_56%_60%)] font-light">AURUM</div>
          <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[rgba(201,168,76,0.5)] to-transparent animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !me) return null;

  return <AdminLayout>{children}</AdminLayout>;
}
