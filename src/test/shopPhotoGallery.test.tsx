import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { shopImage } from '@/lib/shopMedia';

const { mediaByShop } = vi.hoisted(() => ({
  mediaByShop: {
    alpha: [
      'https://photos.test/alpha-one.jpg',
      'https://photos.test/alpha-two.jpg',
      'https://photos.test/alpha-one.jpg',
      '',
    ],
    beta: [
      'https://photos.test/beta-one.jpg',
      'https://photos.test/beta-two.jpg',
      'https://photos.test/beta-three.jpg',
    ],
    single: ['https://photos.test/single.jpg'],
    empty: [],
  } as Record<string, string[]>,
}));

vi.mock('@/lib/shopMediaStore', () => ({
  listShopMedia: async (shopId: string) => mediaByShop[shopId] ?? [],
}));

vi.mock('@/lib/api', () => ({
  getApprovedBarbers: async () => ({
    success: true,
    data: Object.entries({
      alpha: 'Alpha Shop',
      beta: 'Beta Shop',
      single: 'Single Photo Shop',
      empty: 'Empty Photo Shop',
    }).map(([id, shop_name]) => ({ id, shop_name, location: 'Test location' })),
  }),
  getBarberServices: async () => ({ success: true, data: [] }),
}));

import BarberProfile from '@/pages/BarberProfile';

afterEach(() => {
  cleanup();
});

function renderShop(shopId: string, image?: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const search = image ? `?image=${encodeURIComponent(image)}` : '';

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/barber/${shopId}${search}`]}>
        <Routes>
          <Route path="/barber/:shopId" element={<BarberProfile />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Shop details photo gallery', () => {
  it('loads each shop’s own unique photos and wraps manual navigation', async () => {
    const alpha = renderShop('alpha', 'https://photos.test/alpha-two.jpg');
    const alphaImage = await screen.findByRole('img', { name: 'Alpha Shop' });

    await waitFor(() => {
      expect(alphaImage).toHaveAttribute('src', 'https://photos.test/alpha-two.jpg');
      expect(screen.getAllByRole('button', { name: /Show shop photo/ })).toHaveLength(2);
    });
    expect(screen.queryByRole('button', { name: /Previous shop photo|Next shop photo/ })).not.toBeInTheDocument();

    alpha.unmount();
    renderShop('beta');
    const betaImage = await screen.findByRole('img', { name: 'Beta Shop' });
    await waitFor(() => {
      expect(betaImage).toHaveAttribute('src', 'https://photos.test/beta-one.jpg');
      expect(screen.getAllByRole('button', { name: /Show shop photo/ })).toHaveLength(3);
    });
    expect(screen.queryByRole('img', { name: 'Alpha Shop' })).not.toBeInTheDocument();
  });

  it('hides navigation for one photo and keeps the shop fallback when no uploads exist', async () => {
    const single = renderShop('single');
    const singleImage = await screen.findByRole('img', { name: 'Single Photo Shop' });
    await waitFor(() => {
      expect(singleImage).toHaveAttribute('src', 'https://photos.test/single.jpg');
    });
    expect(screen.queryByRole('button', { name: /shop photo/ })).not.toBeInTheDocument();

    single.unmount();
    renderShop('empty');
    const emptyImage = await screen.findByRole('img', { name: 'Empty Photo Shop' });
    await waitFor(() => {
      expect(emptyImage).toHaveAttribute('src', shopImage('empty'));
    });
    expect(screen.queryByRole('button', { name: /shop photo/ })).not.toBeInTheDocument();
  });

  it('supports horizontal swipes and advances automatically after three seconds', async () => {
    renderShop('beta');
    const image = await screen.findByRole('img', { name: 'Beta Shop' });

    await waitFor(() => {
      expect(image).toHaveAttribute('src', 'https://photos.test/beta-one.jpg');
    });

    const gallery = image.parentElement;
    expect(gallery).not.toBeNull();
    fireEvent.touchStart(gallery!, {
      touches: [{ identifier: 1, target: gallery, clientX: 200, clientY: 120 }],
    });
    fireEvent.touchEnd(gallery!, {
      changedTouches: [{ identifier: 1, target: gallery, clientX: 100, clientY: 125 }],
    });
    expect(image).toHaveAttribute('src', 'https://photos.test/beta-two.jpg');

    fireEvent.touchStart(gallery!, {
      touches: [{ identifier: 1, target: gallery, clientX: 100, clientY: 125 }],
    });
    fireEvent.touchEnd(gallery!, {
      changedTouches: [{ identifier: 1, target: gallery, clientX: 200, clientY: 120 }],
    });
    expect(image).toHaveAttribute('src', 'https://photos.test/beta-one.jpg');

    fireEvent.touchStart(gallery!, {
      touches: [{ identifier: 1, target: gallery, clientX: 100, clientY: 125 }],
    });
    fireEvent.touchEnd(gallery!, {
      changedTouches: [{ identifier: 1, target: gallery, clientX: 200, clientY: 120 }],
    });
    expect(image).toHaveAttribute('src', 'https://photos.test/beta-three.jpg');

    fireEvent.click(screen.getByRole('button', { name: 'Show shop photo 2' }));
    expect(image).toHaveAttribute('src', 'https://photos.test/beta-two.jpg');

    await waitFor(
      () => {
        expect(image).toHaveAttribute('src', 'https://photos.test/beta-three.jpg');
      },
      { timeout: 4000, interval: 50 },
    );
  });
});
