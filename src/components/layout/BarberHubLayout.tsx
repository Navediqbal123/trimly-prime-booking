import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { BarberHubSidebar } from './BarberHubSidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { HideOnScroll } from './HideOnScroll';

export function BarberHubLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="page-black min-h-screen flex w-full bg-background">
      <BarberHubSidebar isOpen={sidebarOpen} onOpenChange={setSidebarOpen} />
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile sticky header — hides on scroll down, reappears on scroll up */}
        <HideOnScroll className="lg:hidden sticky top-0 z-40 bg-background/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3">
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
        </HideOnScroll>
        <div className="p-4 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}

