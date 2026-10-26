import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BarberHubSidebar } from './BarberHubSidebar';
import { BarberBottomNav } from './BarberBottomNav';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import { HideOnScroll } from './HideOnScroll';

export function BarberHubLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const showHomeHeader = pathname === '/barber-hub';

  return (
    <div className="page-black min-h-screen flex w-full bg-background">
      <BarberHubSidebar
        isOpen={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="min-w-0 w-full flex-1 overflow-x-hidden">

        {showHomeHeader && (
          <HideOnScroll className="sticky top-0 z-40 bg-background/85 backdrop-blur-md lg:hidden">
            <div className="relative flex items-center justify-between gap-3 border-b border-border bg-background px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
                className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff963f] to-[#ff7417] text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(190,65,0,0.18),0_5px_10px_rgba(255,116,23,0.20)] transition-transform duration-150 active:scale-95 hover:bg-gradient-to-b hover:from-[#ff963f] hover:to-[#ff7417] hover:text-white [&_svg]:size-6"
              >
                <Menu strokeWidth={2.5} />
              </Button>

              <span className="absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[25px] font-display font-extrabold leading-none tracking-tight text-foreground sm:text-3xl">
                Barber <span className="text-[#ff7417]">Hub</span>
              </span>
            </div>
          </HideOnScroll>
        )}

        {/* Barber Hub Page Content */}
        <div className="mx-auto w-full min-w-0 p-4 pb-28 lg:p-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>

        {/* Fixed Bottom Navigation for all Barber Hub pages */}
        <BarberBottomNav />

      </main>
    </div>
  );
}