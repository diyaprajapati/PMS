'use client';

import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Label } from '../ui/label';
import { AddSprintDialog } from './AddSprintDialog';
import { SprintTable } from './SprintTable';
import { useProjectFromSearchParams } from '@/hooks/use-project-from-search-params';

export default function Sprint() {
  const { projectId } = useProjectFromSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSprintCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!projectId) {
    return (
      <div className='flex flex-col items-center justify-center h-full w-full gap-4'>
        <p className='text-muted-foreground'>Please select a project</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4 h-full w-full overflow-y-auto'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-semibold'>Sprints</h2>
          <p className='text-sm text-muted-foreground'>Manage your project sprints</p>
        </div>
        <AddSprintDialog onSuccess={handleSprintCreated} />
      </div>
      <div className='flex-1 overflow-y-auto'>
        <SprintTable key={refreshKey} onRefresh={handleRefresh} />
      </div>
    </div>
  );
}
