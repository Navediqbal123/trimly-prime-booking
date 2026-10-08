import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/hooks/useLikedShops', () => ({
  useLikedShops: () => ({
    likedShops: [{ id: 's1', shop_id: 's1', barber_id: 's1' }],
    likedShopIds: new Set(['s1']),
    toggleLike: vi.fn(),
    pendingShopIds: new Set(),
    isLoading: false,
    error: null,
  }),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ select: async () => ({ data: [], error: null }) }) },
}));
vi.mock('@/lib/shopMediaStore', () => ({ listAllShopMedia: async () => ({}) }));
vi.mock('@/lib/api', () => ({ getApprovedBarbers: async () => ({ success: true, data: [] }) }));

import LikedShops from '@/pages/LikedShops';

describe('Liked Shops page', () => {
  it('renders liked shops when the Dashboard already cached the shop list', () => {
    const client = new QueryClient();
    client.setQueryData(['approvedBarbersHome'], {
      list: [{ id: 's1', shop_name: 'Naved Salon', location: 'Delhi', description: null }],
      error: null,
    });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter><LikedShops /></MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Naved Salon')).toBeTruthy();
  });
});
