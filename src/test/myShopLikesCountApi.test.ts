import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession } },
}));

import { getMyShopLikesCount } from '@/lib/api';

describe('getMyShopLikesCount', () => {
  beforeEach(() => {
    getSession.mockResolvedValue({
      data: { session: { access_token: 'session-token' } },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('requests the authenticated barber count endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ count: 9 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getMyShopLikesCount()).resolves.toEqual({
      success: true,
      data: { count: 9 },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/liked-shops/my-shop/count'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
        }),
      }),
    );
  });
});
