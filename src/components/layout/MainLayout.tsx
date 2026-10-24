import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { BarberBottomNav } from './BarberBottomNav';
import { PageTransition } from '@/components/PageTransition';

export function MainLayout() {
  const { pathname } = useLocation();
  const isBarberHub = pathname.startsWith('/barber-hub');
  const isAdminRoute = pathname.startsWith('/admin/');
  const [adminSidebarOpen, setAdminSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar
        adminMode={isAdminRoute}
        isOpen={isAdminRoute ? adminSidebarOpen : undefined}
        onOpenChange={isAdminRoute ? setAdminSidebarOpen : undefined}
      />

      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="p-4 pt-4 lg:p-8 lg:pt-8 pb-36 lg:pb-8">
          <PageTransition>
            <Outlet context={{ openAdminSidebar: () => setAdminSidebarOpen(true) }} />
          </PageTransition>
        </div>
      </main>

      {!isAdminRoute && (isBarberHub ? <BarberBottomNav /> : <BottomNav />)}
    </div>
  );
}
