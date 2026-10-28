import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { api, supabaseMock, setShopLiked } = vi.hoisted(() => {
  const profileQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
  };
  profileQuery.select.mockReturnValue(profileQuery);
  profileQuery.eq.mockReturnValue(profileQuery);
  profileQuery.maybeSingle.mockResolvedValue({
    data: {
      avatar_url: 'https://photos.test/barber-profile.jpg',
      phone: '5551234567',
      created_at: '2022-03-04T00:00:00.000Z',
    },
    error: null,
  });

  const reviewsQuery = {
    select: vi.fn(),
    eq: vi.fn(),
  };
  reviewsQuery.select.mockReturnValue(reviewsQuery);
  reviewsQuery.eq.mockResolvedValue({
    data: [{ rating: 4 }, { rating: 5 }],
    error: null,
  });

  return {
    api: {
      getApprovedBarbers: vi.fn(),
      getBarberServices: vi.fn(),
    },
    supabaseMock: {
      from: vi.fn((table: string) => (table === 'profiles' ? profileQuery : reviewsQuery)),
    },
    setShopLiked: vi.fn(),
  };
});

vi.mock('@/lib/api', () => api);
vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));
vi.mock('@/lib/shopMediaStore', () => ({ listShopMedia: vi.fn().mockResolvedValue([]) }));
vi.mock('@/hooks/useLikedShops', () => ({
  useLikedShops: () => ({
    likedShopIds: new Set(['shop-1']),
    pendingShopIds: new Set(),
    setShopLiked,
  }),
}));
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import BarberProfile from '@/pages/BarberProfile';
import CustomerBarberProfile from '@/pages/CustomerBarberProfile';

const shop = {
  id: 'shop-1',
  shop_name: 'Trimly Studio',
  location: 'Old Town',
  address: '14 Market Road, North Industrial District, opposite Central Market',
  locality: 'Old Town Business Quarter',
  city: 'New Delhi Municipal District',
  state: 'Delhi',
  pincode: '110001',
  description: 'A welcoming neighborhood barber. '.repeat(12),
  phone: '5551112222',
  user_id: 'barber-user-1',
  status: 'approved',
  user: { email: 'barber@example.test', name: 'Barber' },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

function renderShopRoute(initialEntry: string) {
  api.getApprovedBarbers.mockResolvedValue({ success: true, data: [shop] });
  api.getBarberServices.mockResolvedValue({ success: true, data: [] });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/barber/:shopId" element={<BarberProfile />} />
          <Route path="/barber/:shopId/profile" element={<CustomerBarberProfile />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openShopMenu() {
  fireEvent.click(await screen.findByRole('button', { name: 'Open shop menu' }));
  return screen.findByRole('menu', { name: 'Shop actions' });
}

describe('customer-facing barber profile', () => {
  it('opens the dedicated profile from shop details for the same shop', async () => {
    renderShopRoute('/barber/shop-1');

    fireEvent.click(await screen.findByRole('button', { name: 'Visit barber profile' }));

    expect(await screen.findByRole('heading', { name: 'Trimly Studio' })).toBeInTheDocument();
    expect(await screen.findByAltText('Trimly Studio profile photo')).toHaveAttribute(
      'src',
      'https://photos.test/barber-profile.jpg',
    );
  });

  it('shows real profile details and only an available account creation date', async () => {
    renderShopRoute('/barber/shop-1/profile');

    expect(await screen.findByRole('heading', { name: 'Trimly Studio' })).toBeInTheDocument();
    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(2 reviews)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '5551112222' })).toHaveAttribute(
      'href',
      'tel:5551112222',
    );
    expect(screen.getByRole('link', { name: 'barber@example.test' })).toHaveAttribute(
      'href',
      'mailto:barber@example.test',
    );
    expect(screen.queryByText(/likes/i)).not.toBeInTheDocument();

    await openShopMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'About this account' }));
    expect(await screen.findByText(/Account created/)).toBeInTheDocument();
    expect(screen.getByText(/2022/)).toBeInTheDocument();
  });

  it('expands and collapses the bio and full location and renders independent empty tabs', async () => {
    renderShopRoute('/barber/shop-1/profile');

    const moreButton = await screen.findByRole('button', { name: 'More' });
    fireEvent.click(moreButton);
    expect(screen.getByRole('button', { name: 'Less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Less' }));

    const locationButton = screen.getByRole('button', { name: 'Show full location' });
    fireEvent.click(locationButton);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));

    expect(screen.getByRole('tab', { name: 'posts' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No posts yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'reels' }));
    expect(screen.getByRole('tab', { name: 'reels' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No reels yet')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /shop photo/i })).not.toBeInTheDocument();
  });

  it('uses the shared liked-shop action and copies/shares this profile URL', async () => {
    const copyUrl = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText: copyUrl } });
    renderShopRoute('/barber/shop-1/profile');

    await openShopMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unlike' }));
    expect(setShopLiked).toHaveBeenCalledWith('shop-1', false);

    await openShopMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy URL' }));
    await waitFor(() => {
      expect(copyUrl).toHaveBeenCalledWith(
        `${window.location.origin}/barber/shop-1/profile`,
      );
    });
  });

  it('opens the existing support page for reports and shares the current profile URL', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    const openSupport = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderShopRoute('/barber/shop-1/profile');

    await openShopMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Share shop' }));
    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: 'Trimly Studio',
        url: `${window.location.origin}/barber/shop-1/profile`,
      });
    });

    await openShopMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Report' }));
    expect(openSupport).toHaveBeenCalledWith(
      '/contact-us.html',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
