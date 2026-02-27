'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSession } from 'next-auth/react';
import { toast } from 'sonner';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { ProjectBreadcrumb } from '@/components/project-breadcrumb';
import Sprint from '@/components/sprints/Sprint';

// ---------------------------------------------------------------------------
// Dashboard inner content
// ---------------------------------------------------------------------------

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, project, projectLoading } = useProjectFromSearchParams();

  // -------------------------------------------------------------------------
  // Auth check (keep existing logic)
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const ensureTokenFromSession = async () => {
      let token = localStorage.getItem('token');

      const isRealJWT = (t: string | null): boolean => {
        if (!t) return false;
        const parts = t.split('.');
        if (parts.length !== 3) return false;
        if (parts[2] === 'x' || (parts[2]?.length ?? 0) < 10) return false;
        try {
          const payload = JSON.parse(atob(parts[1] ?? ''));
          return !!(payload?.id || payload?.email);
        } catch { return false; }
      };

      const hasRealToken = token && isRealJWT(token);

      if (!hasRealToken) {
        try {
          const meResponse = await fetch('/api/auth/me', { credentials: 'include' });
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData?.user && token && !isRealJWT(token)) {
              localStorage.removeItem('token');
            }
          }
        } catch { /* ignore */ }

        const session = await getSession();
        if (!session) {
          if (token) localStorage.removeItem('token');
          void fetch('/api/auth/logout', { method: 'POST' });
          router.replace('/login');
          return;
        }

        try {
          const tokenResponse = await fetch('/api/auth/google-token', { method: 'POST', credentials: 'include' });
          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            if (typeof tokenData?.token === 'string') {
              token = tokenData.token as string;
              localStorage.setItem('token', token);
            } else { throw new Error('No token in response'); }
          } else { throw new Error(`Failed to create token: ${tokenResponse.status}`); }
        } catch {
          const nowSeconds = Math.floor(Date.now() / 1000);
          const exp = nowSeconds + 60 * 60;
          const encode = (obj: unknown) =>
            btoa(JSON.stringify(obj)).replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
          token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ exp })}.x`;
          localStorage.setItem('token', token);
        }
      }

      if (!token) {
        localStorage.removeItem('token');
        void fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/login');
        return;
      }

      const currentToken = token;
      try {
        const payload = JSON.parse(atob(currentToken.split('.')[1] ?? '')) as { exp?: number };
        if (!payload?.exp) { localStorage.removeItem('token'); void fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); return; }
        const expireAt = payload.exp * 1000;
        const now = Date.now();
        if (expireAt <= now) {
          localStorage.removeItem('token');
          void fetch('/api/auth/logout', { method: 'POST' });
          toast.error('Session expired. Please log in again.');
          router.replace('/login');
          return;
        }
        const timeoutId = window.setTimeout(() => {
          localStorage.removeItem('token');
          void fetch('/api/auth/logout', { method: 'POST' });
          toast.error('Session expired. Please log in again.');
          router.replace('/login');
        }, expireAt - now);
        return () => window.clearTimeout(timeoutId);
      } catch {
        localStorage.removeItem('token');
        void fetch('/api/auth/logout', { method: 'POST' });
        router.replace('/login');
      }
    };

    void ensureTokenFromSession();
  }, [router]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const token = localStorage.getItem('token');
        if (!token) { router.replace('/login'); return; }
        fetch('/api/auth/me', { credentials: 'include' })
          .then((res) => { if (!res.ok) router.replace('/login'); })
          .catch(() => router.replace('/login'));
      }
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [router]);

  useEffect(() => {
    const from = searchParams.get('from');
    const error = searchParams.get('error');
    if (from === 'google' && !error) toast.success('Logged in with Google');
    if (error) toast.error('Google authentication failed. Please try again.');
  }, [searchParams]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <>
      <header className="flex h-20 shrink-0 items-center gap-2 border-b border-border/50 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
        <div className="flex items-center gap-3 px-6">
          <SidebarTrigger className="-ml-1 transition-all duration-200" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-5"
          />
          <Breadcrumb>
            <ProjectBreadcrumb
              projectId={projectId}
              project={project}
              projectLoading={projectLoading}
              tabName="Sprints"
            />
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <Sprint />
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={
          <header className="flex h-20 shrink-0 items-center gap-3 px-6 border-b border-border/50">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-muted-foreground text-base font-medium">Sprints</span>
          </header>
        }>
          <DashboardContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
