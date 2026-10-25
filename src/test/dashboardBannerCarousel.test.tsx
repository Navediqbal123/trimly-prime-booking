import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useLikedShops', () => ({
  useLikedShops: () => ({
    likedShopIds: new Set<string>(),
    toggleLike: vi.fn(),
    pendingShopIds: new Set<string>(),
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: async () => ({ data: [], error: null }),
    }),
  },
}));

vi.mock('@/lib/api', () => ({
  getApprovedBarbers: async () => ({ success: true, data: [] }),
}));

vi.mock('@/lib/shopMediaStore', () => ({
  listAllShopMedia: async () => ({}),
}));

import Dashboard from '@/pages/Dashboard';

afterEach(() => {
  cleanup();
});

function renderDashboard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function swipe(element: Element, fromX: number, toX: number) {
  fireEvent.touchStart(element, {
    touches: [{ identifier: 1, target: element, clientX: fromX, clientY: 100 }],
  });
  fireEvent.touchEnd(element, {
    changedTouches: [{ identifier: 1, target: element, clientX: toX, clientY: 105 }],
  });
}

describe('Dashboard promotional banner', () => {
  it('uses swipe-only navigation, retains full width, and keeps the dots interactive', async () => {
    renderDashboard();
    const firstTitle = await screen.findByText('Fresh Style');
    const banner = firstTitle.closest('section');
    expect(banner).not.toBeNull();
    expect(banner).toHaveClass('w-full', 'touch-pan-y');
    expect(banner).not.toHaveClass('pl-14', 'pr-14');
    expect(screen.queryByRole('button', { name: /promotional banner/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Show banner/ })).toHaveLength(4);

    swipe(screen.getByRole('button', { name: /Book Now/ }), 200, 100);
    expect(screen.getByText('Fresh Style')).toBeInTheDocument();
    swipe(firstTitle, 200, 100);
    expect(await screen.findByText('Look Sharp')).toBeInTheDocument();
    swipe(screen.getByText('Look Sharp'), 100, 200);
    expect(await screen.findByText('Fresh Style')).toBeInTheDocument();
    swipe(screen.getByText('Fresh Style'), 100, 200);
    expect(await screen.findByText('CUSTOM STYLR')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show banner 2' }));
    expect(await screen.findByText('Look Sharp')).toBeInTheDocument();
  });

  it('continues five-second rotation after manual navigation', async () => {
    renderDashboard();
    const firstTitle = await screen.findByText('Fresh Style');
    swipe(firstTitle, 200, 100);
    expect(await screen.findByText('Look Sharp')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.getByText('Your Style')).toBeInTheDocument();
      },
      { timeout: 6000, interval: 50 },
    );
  }, 8000);
});
