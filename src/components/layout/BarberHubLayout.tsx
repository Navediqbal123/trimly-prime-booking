import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BarberHubSidebar } from './BarberHubSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function BarberHubLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <BarberHubSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 lg:p-8">
          {/* Mobile header with menu trigger */}
          <div className="flex items-center gap-3 mb-4 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="h-12 w-12 [&_svg]:size-7"
            >
              <Menu />
            </Button>
            <span className="text-2xl font-display font-bold gradient-text tracking-tight">Barber&nbsp;&nbsp;Hub</span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
