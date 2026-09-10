import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';
import { BarberBottomNav } from './BarberBottomNav';
import { PageTransition } from '@/components/PageTransition';

export function MainLayout() {
  const { pathname } = useLocation();
  const isBarberHub = pathname.startsWith('/barber-hub');

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 pb-36 lg:pb-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {isBarberHub ? <BarberBottomNav /> : <BottomNav />}
    </div>
  );
}