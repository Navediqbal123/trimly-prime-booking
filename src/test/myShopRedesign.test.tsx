import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const { navigation, api, supabaseMock } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: vi.fn(),
    then: vi.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({
    data: { avatar_url: 'https://photos.test/barber.jpg', phone: '5551234567' },
    error: null,
  });
  query.then.mockImplementation((resolve: (value: unknown) => unknown) =>
    Promise.resolve({
      data: [{ rating: 4 }, { rating: 5 }],
      error: null,
    }).then(resolve),
  );

  return {
    navigation: { navigate: vi.fn() },
    api: {
      getMyBarberProfile: vi.fn(),
      getMyShopLikesCount: vi.fn(),
      getMyServices: vi.fn(),
      updateMyShop: vi.fn(),
      deleteMyShop: vi.fn(),
    },
    supabaseMock: {
      from: vi.fn(() => query),
      storage: { from: vi.fn() },
    },
  };
});

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigation.navigate };
});

vi.mock('@/contexts/ProtectedUserContext', () => ({
  useProtectedUser: () => ({
    user: {
      id: 'auth-user-1',
      full_name: 'Real Barber Name',
      email: 'barber@example.test',
    },
  }),
}));

vi.mock('@/lib/api', () => api);
vi.mock('@/lib/shopMediaStore', () => ({
  listShopMedia: async () => [
    'https://photos.test/shop-1.jpg',
    'https://photos.test/shop-2.jpg',
  ],
  uploadShopImage: vi.fn(),
  deleteShopImage: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));
vi.mock('@/lib/nativeImagePicker', () => ({ pickNativeImages: vi.fn() }));

function dispatchPointer(
  target: Element,
  type: 'pointerdown' | 'pointerup',
  values: { pointerId: number; pointerType: string; clientX: number; clientY: number },
) {
  const event = new Event(type, { bubbles: true });
  Object.assign(event, values);
  target.dispatchEvent(event);
}

import MyShop from '@/pages/barber/MyShop';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderMyShop(
  likesResponse: { success: boolean; data?: { count: number }; error?: string } = {
    success: true,
    data: { count: 23 },
  },
) {
  api.getMyBarberProfile.mockResolvedValue({
    success: true,
    data: {
      id: 'barber-1',
      shop_name: 'Actual Trimly Shop',
      location: 'Actual saved address',
      status: 'approved',
      description: 'A saved description for the barber shop.',
      phone: '5551234567',
    },
  });
  api.getMyServices.mockResolvedValue({
    success: true,
    data: [
      { id: 'service-1', name: 'Cut', barber_id: 'barber-1' },
      { id: 'service-2', name: 'Beard trim', barber_id: 'barber-1' },
    ],
  });
  api.getMyShopLikesCount.mockResolvedValue(likesResponse);
  api.updateMyShop.mockResolvedValue({ success: true });
  api.deleteMyShop.mockResolvedValue({ success: true });

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, client };
}

function openShopMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Open shop menu' }));
}

describe('My Shop redesign', () => {
  it('renders actual profile/shop data, statistics, contacts, and a swipe gallery', async () => {
    renderMyShop();

    expect(await screen.findByRole('heading', { name: 'Real Barber Name' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Actual Trimly Shop' })).toBeInTheDocument();
    expect(screen.getByText('Actual saved address')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /5551234567/ })).toHaveAttribute(
      'href',
      'tel:5551234567',
    );
    expect(screen.getByRole('img', { name: 'Real Barber Name profile' })).toHaveAttribute(
      'src',
      'https://photos.test/barber.jpg',
    );
    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Services').previousElementSibling).toHaveTextContent('2');
    expect(screen.getAllByText('Services')).toHaveLength(1);
    expect(screen.getByText('Likes').previousElementSibling).toHaveTextContent('23');
    expect(api.getMyShopLikesCount).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('count')).not.toBeInTheDocument();
    expect(screen.getByText('4.5').nextElementSibling).toHaveTextContent('2 reviews');

    const galleryRegion = screen.getByRole('region', { name: 'Shop photo gallery' });
    const gallery = galleryRegion.querySelector('.touch-pan-y');
    expect(gallery).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Shop photo 1' })).toHaveAttribute(
      'src',
      'https://photos.test/shop-1.jpg',
    );
    act(() => {
      dispatchPointer(gallery!, 'pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 220,
        clientY: 100,
      });
      dispatchPointer(gallery!, 'pointerup', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 100,
        clientY: 105,
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Shop photo 2' })).toHaveAttribute(
        'src',
        'https://photos.test/shop-2.jpg',
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show gallery item 2' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Show gallery item 2' })).toHaveAttribute(
        'aria-current',
        'true',
      );
    });
    act(() => {
      dispatchPointer(gallery!, 'pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 100,
        clientY: 105,
      });
      dispatchPointer(gallery!, 'pointerup', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 220,
        clientY: 100,
      });
    });
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Shop photo 1' })).toHaveAttribute(
        'src',
        'https://photos.test/shop-1.jpg',
      );
    });
    fireEvent.click(screen.getByRole('button', { name: 'Show gallery item 3' }));
    expect(screen.getByRole('button', { name: 'Add shop photo' })).toBeInTheDocument();
  }, 15000);

  it('refreshes likes on query invalidation and shows an unavailable state on API errors', async () => {
    const { client } = renderMyShop();
    expect(await screen.findByText('23')).toBeInTheDocument();

    api.getMyShopLikesCount.mockResolvedValue({
      success: true,
      data: { count: 24 },
    });
    await client.invalidateQueries({ queryKey: ['myShopLikesCount', 'auth-user-1'] });
    expect(await screen.findByText('24')).toBeInTheDocument();
    expect(api.getMyShopLikesCount).toHaveBeenCalledTimes(2);

    cleanup();
    renderMyShop({ success: false, error: 'Likes are temporarily unavailable.' });
    const unavailableLikes = await screen.findByText('Unavailable');
    expect(unavailableLikes).toBeInTheDocument();
    expect(unavailableLikes.parentElement).toHaveAttribute(
      'title',
      'Likes are temporarily unavailable.',
    );
  });

  it('opens Edit Shop and keeps Delete Shop behind confirmation in the menu', async () => {
    renderMyShop();
    await screen.findByRole('heading', { name: 'Actual Trimly Shop' });

    expect(screen.queryByRole('button', { name: /Delete Shop Permanently/ })).not.toBeInTheDocument();
    openShopMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit Shop' }));
    expect(await screen.findByRole('heading', { name: 'Edit Shop' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Shop location' })).toHaveValue(
      'Actual saved address',
    );
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    openShopMenu();
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Delete Shop' }));
    expect(await screen.findByRole('heading', { name: 'Delete Shop Permanently?' })).toBeInTheDocument();
    expect(api.deleteMyShop).not.toHaveBeenCalled();
  }, 15000);

  it('uses the existing add-service route from the add action selector', async () => {
    renderMyShop();
    await screen.findByRole('heading', { name: 'Actual Trimly Shop' });
    fireEvent.click(screen.getByRole('button', { name: 'Add service or shop photo' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Add a service' }));
    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('/barber-hub/services');
    });
  });
});
