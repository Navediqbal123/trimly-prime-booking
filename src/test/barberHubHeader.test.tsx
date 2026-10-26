import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/components/layout/BarberHubSidebar', () => ({
  BarberHubSidebar: ({
    isOpen,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
  }) => <div data-testid="barber-sidebar">{isOpen ? 'Menu open' : 'Menu closed'}</div>,
}));

vi.mock('@/components/layout/BarberBottomNav', () => ({
  BarberBottomNav: () => <div data-testid="barber-bottom-nav" />,
}));

vi.mock('@/components/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/layout/HideOnScroll', () => ({
  HideOnScroll: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { BarberHubLayout } from '@/components/layout/BarberHubLayout';

afterEach(cleanup);

function renderBarberRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<BarberHubLayout />}>
          <Route path="/barber-hub" element={<div>Dashboard content</div>} />
          <Route path="/barber-hub/bookings" element={<div>Appointments content</div>} />
          <Route path="/barber-hub/services" element={<div>Services content</div>} />
          <Route path="/barber-hub/earnings" element={<div>Earnings content</div>} />
          <Route path="/barber-hub/shop" element={<div>My Shop content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Barber Hub home header', () => {
  it('shows the branded header on the dashboard and opens the existing menu', () => {
    renderBarberRoute('/barber-hub');

    expect(screen.getByText('Barber', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Hub', { exact: true })).toHaveClass('text-[#ff7417]');

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByText('Menu open')).toBeInTheDocument();
    expect(screen.getByTestId('barber-bottom-nav')).toBeInTheDocument();
  });

  it.each([
    ['/barber-hub/bookings', 'Appointments content'],
    ['/barber-hub/services', 'Services content'],
    ['/barber-hub/earnings', 'Earnings content'],
    ['/barber-hub/shop', 'My Shop content'],
  ])('hides the branded header on %s', (path, content) => {
    renderBarberRoute(path);

    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open menu' })).not.toBeInTheDocument();
    expect(screen.queryByText('Hub', { exact: true })).not.toBeInTheDocument();
    expect(screen.getByTestId('barber-bottom-nav')).toBeInTheDocument();
  });
});
