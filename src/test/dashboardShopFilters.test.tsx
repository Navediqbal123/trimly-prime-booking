import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { getApprovedBarbers, getBarberServices, supabaseMock } = vi.hoisted(() => ({
  getApprovedBarbers: vi.fn(),
  getBarberServices: vi.fn(),
  supabaseMock: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ getApprovedBarbers, getBarberServices }));
vi.mock('@/lib/supabase', () => ({ supabase: supabaseMock }));
vi.mock('@/lib/shopMediaStore', () => ({
  listAllShopMedia: vi.fn().mockResolvedValue({}),
}));
vi.mock('@/lib/shopMedia', () => ({
  shopImage: (shopId: string) => `https://photos.test/${shopId}.jpg`,
}));

import Dashboard from '@/pages/Dashboard';

const shops = [
  {
    id: 'shop-low',
    shop_name: 'Lower Rated Shop',
    location: 'Long address used as fallback',
    latitude: 28.6,
    longitude: 77.2,
    description: 'Low rated description',
    locality: 'Karol Bagh',
    city: 'Delhi',
    user_id: 'barber-low',
    status: 'approved',
  },
  {
    id: 'shop-high',
    shop_name: 'Top Rated Shop',
    location: 'A different address',
    description: 'High rated description',
    locality: 'Connaught Place',
    city: 'Delhi',
    user_id: 'barber-high',
    status: 'approved',
  },
];

const ratings = [
  { barber_id: 'shop-low', rating: 3 },
  { barber_id: 'shop-low', rating: 4 },
  { barber_id: 'shop-high', rating: 5 },
  { barber_id: 'shop-high', rating: 5 },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderDashboard() {
  getApprovedBarbers.mockResolvedValue({ success: true, data: shops });
  getBarberServices.mockImplementation(async (shopId: string) => ({
    success: true,
    data: shopId === 'shop-high'
      ? [{ id: 'service-1', barber_id: shopId, name: 'Cut', price: 20, duration: 30, home_service: true }]
      : [{ id: 'service-2', barber_id: shopId, name: 'Trim', price: 15, duration: 20, home_service: false }],
  }));
  supabaseMock.from.mockImplementation((table: string) => ({
    select: vi.fn().mockResolvedValue({
      data: table === 'reviews' ? ratings : [],
      error: null,
    }),
  }));

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/barber/:shopId/profile" element={<p>Customer barber profile</p>} />
          <Route path="/barber/:shopId" element={<p>Shop details</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, client };
}

function findShopHeading(name: string) {
  return screen.findByRole('heading', { name }, { timeout: 10_000 });
}

describe('Dashboard shop filters and cards', () => {
  it('renders four filters, sorts by real ratings, and disables unsupported filters', async () => {
    const { client } = renderDashboard();

    await waitFor(() => {
      expect(client.getQueryData(['approvedBarbersHome'])).toEqual(
        expect.objectContaining({ list: expect.arrayContaining([expect.objectContaining({ id: 'shop-low' })]) }),
      );
    });
    expect(await findShopHeading('Lower Rated Shop')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Top Rated/ })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Recommended/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Premium/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Home Service/ })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /Top Rated/ }));
    await waitFor(() => {
      const cardHeadings = screen.getAllByRole('heading', { level: 3 });
      expect(cardHeadings[0]).toHaveTextContent('Top Rated Shop');
      expect(cardHeadings[1]).toHaveTextContent('Lower Rated Shop');
    }, { timeout: 10_000 });
  }, 20_000);

  it('filters only shops whose real services provide home service', async () => {
    renderDashboard();
    await findShopHeading('Lower Rated Shop');

    fireEvent.click(screen.getByRole('button', { name: /Home Service/ }));

    expect(await findShopHeading('Top Rated Shop')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lower Rated Shop' })).not.toBeInTheDocument();
    expect(getBarberServices).toHaveBeenCalledWith('shop-low');
    expect(getBarberServices).toHaveBeenCalledWith('shop-high');
  }, 20_000);

  it('shows real card details, uses coordinates for maps, and provides fallback for a broken image', async () => {
    renderDashboard();

    const shopHeading = await findShopHeading('Lower Rated Shop');
    const card = shopHeading.closest('article');
    expect(card).not.toBeNull();
    expect(screen.getByText('Karol Bagh, Delhi')).toBeInTheDocument();
    expect(screen.getByText('3.5')).toBeInTheDocument();
    expect(within(card!).getByText('(2 reviews)')).toBeInTheDocument();

    const mapLink = screen.getByRole('link', { name: 'Open map for Lower Rated Shop' });
    expect(mapLink).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=28.6,77.2',
    );
    const highRatedCard = screen
      .getByRole('heading', { name: 'Top Rated Shop' })
      .closest('article');
    expect(
      within(highRatedCard!).getByRole('link', { name: 'Open map for Top Rated Shop' }),
    ).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=Connaught%20Place%2C%20Delhi',
    );

    const image = screen.getByRole('img', { name: 'Lower Rated Shop shop' });
    fireEvent.error(image);
    expect(
      await screen.findByRole(
        'img',
        { name: 'Lower Rated Shop shop image unavailable' },
        { timeout: 10_000 },
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Photo unavailable')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /like|unlike/i })).not.toBeInTheDocument();

  }, 20000);

  it('uses the existing details and customer-profile navigation actions', async () => {
    renderDashboard();

    await findShopHeading('Lower Rated Shop');
    fireEvent.click(screen.getAllByText('Visit')[0].closest('button')!);
    expect(await screen.findByText('Shop details')).toBeInTheDocument();

    cleanup();
    renderDashboard();
    await findShopHeading('Top Rated Shop');
    fireEvent.click(screen.getAllByRole('button', { name: 'Barber Profile' })[1]);
    expect(await screen.findByText('Customer barber profile')).toBeInTheDocument();
  }, 20000);

  it('keeps shop search working', async () => {
    renderDashboard();
    await findShopHeading('Lower Rated Shop');

    fireEvent.change(screen.getByPlaceholderText('Search for barber shops...'), {
      target: { value: 'Connaught' },
    });

    expect(await findShopHeading('Top Rated Shop')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Lower Rated Shop' })).not.toBeInTheDocument();
  });
});
