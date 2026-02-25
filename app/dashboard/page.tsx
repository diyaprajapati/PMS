'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSession } from 'next-auth/react';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskTable } from '@/components/tasks/TaskTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Sprint = {
  id: string;
  title: string;
  status: 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
};

// ---------------------------------------------------------------------------
// Sprint selector
// ---------------------------------------------------------------------------

function SprintSelector({
  sprints,
  selected,
  onSelect,
}: {
  sprints: Sprint[];
  selected: Sprint | null;
  onSelect: (s: Sprint) => void;
}) {
  const [open, setOpen] = useState(false);

  const statusColor: Record<Sprint['status'], string> = {
    NOT_STARTED: 'bg-slate-400',
    ACTIVE: 'bg-emerald-500',
    COMPLETED: 'bg-muted-foreground/40',
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-background hover:bg-accent/40 transition-colors text-sm font-medium">
          {selected ? (
            <>
              <span className={cn('size-1.5 rounded-full shrink-0', statusColor[selected.status])} />
              <span>{selected.title}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Select sprint</span>
          )}
          <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-1 w-56">
        {sprints.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No sprints found</p>
        ) : (
          sprints.map((sprint) => (
            <button
              key={sprint.id}
              onClick={() => { onSelect(sprint); setOpen(false); }}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors text-left',
                selected?.id === sprint.id && 'bg-accent'
              )}
            >
              <span className={cn('size-1.5 rounded-full shrink-0', statusColor[sprint.status])} />
              <span className="truncate">{sprint.title}</span>
              {sprint.status === 'ACTIVE' && (
                <span className="ml-auto text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">Active</span>
              )}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Dashboard inner content
// ---------------------------------------------------------------------------

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, project, projectLoading } = useProjectFromSearchParams();

  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [totalHours, setTotalHours] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState(0);

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
  // Fetch sprints when project changes
  // -------------------------------------------------------------------------

  const fetchSprints = useCallback(async () => {
    if (!projectId) return;
    setSprintsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sprints`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data: Sprint[] = await res.json();
      setSprints(data);
      // Auto-select active sprint, else first sprint
      const active = data.find((s) => s.status === 'ACTIVE');
      setSelectedSprint((prev) => prev ?? active ?? data[0] ?? null);
    } catch {
      toast.error('Failed to load sprints');
    } finally {
      setSprintsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      setSprints([]);
      setSelectedSprint(null);
      fetchSprints();
    }
  }, [projectId, fetchSprints]);

  // -------------------------------------------------------------------------
  // Total hours from tasks
  // -------------------------------------------------------------------------

  const handleTasksLoaded = useCallback((tasks: Task[]) => {
    const sumHours = (list: Task[]): number =>
      list.reduce((acc, t) => {
        const sub = t.subtasks ? sumHours(t.subtasks) : 0;
        return acc + (t.estimatedHours ?? 0) + sub;
      }, 0);
    setTotalHours(sumHours(tasks));
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-border/50">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />

          {projectLoading ? (
            <div className="h-5 w-32 rounded bg-muted animate-pulse" />
          ) : project ? (
            <span className="font-semibold text-base truncate">{project.name}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Dashboard</span>
          )}

          {project && !sprintsLoading && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <SprintSelector
                sprints={sprints}
                selected={selectedSprint}
                onSelect={setSelectedSprint}
              />
              {totalHours > 0 && (
                <span className="ml-2 text-xs text-muted-foreground/70 tabular-nums">
                  {totalHours}h total
                </span>
              )}
            </>
          )}
        </header>

        {/* Body */}
        <div className="flex flex-1 flex-col p-6 md:p-8 overflow-auto">
          {!projectId && !projectLoading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground text-base text-center max-w-sm">
                Select a project from{' '}
                <Link href="/projects" className="text-primary underline hover:text-primary/80 transition-colors font-medium">
                  Projects
                </Link>{' '}
                to get started.
              </p>
            </div>
          )}

          {projectId && !selectedSprint && !sprintsLoading && sprints.length === 0 && (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground text-sm text-center">
                No sprints yet.{' '}
                <Link href={`/sprints?project=${projectId}`} className="text-primary underline hover:text-primary/80 transition-colors">
                  Create a sprint
                </Link>{' '}
                to start planning tasks.
              </p>
            </div>
          )}

          {projectId && selectedSprint && (
            <TaskTable
              key={`${selectedSprint.id}-${refreshKey}`}
              sprintId={selectedSprint.id}
              onRefresh={() => setRefreshKey((k) => k + 1)}
              onLoad={handleTasksLoaded}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
