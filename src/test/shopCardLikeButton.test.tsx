import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShopCard } from '@/components/ShopCard';

describe('ShopCard like button', () => {
  it('uses the orange circular button and calls the existing handler once without opening the shop', () => {
    const onOpen = vi.fn();
    const onToggleLike = vi.fn((event: React.MouseEvent<HTMLButtonElement>, _shopId: string) => {
      event.stopPropagation();
    });

    render(
      <ShopCard
        shop={{ id: 'shop-1', shop_name: 'Sample Shop', location: 'Delhi' }}
        rating={4.5}
        reviewCount={2}
        gallery={['https://photos.test/shop.jpg']}
        isLiked={false}
        onToggleLike={onToggleLike}
        onOpen={onOpen}
      />,
    );

    const likeButton = screen.getByRole('button', { name: 'Like Sample Shop' });
    expect(likeButton).toHaveClass('h-12', 'w-12', 'rounded-full');
    expect(likeButton.className).toContain('from-[#ff963f]');
    expect(likeButton).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(likeButton);

    expect(onToggleLike).toHaveBeenCalledTimes(1);
    expect(onToggleLike.mock.calls[0][1]).toBe('shop-1');
    expect(onOpen).not.toHaveBeenCalled();
  });
});
