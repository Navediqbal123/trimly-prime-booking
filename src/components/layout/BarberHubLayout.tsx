import { Outlet } from 'react-router-dom';
import { BarberHubSidebar } from './BarberHubSidebar';

export function BarberHubLayout() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      <BarberHubSidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="p-4 lg:p-8 pt-16">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
