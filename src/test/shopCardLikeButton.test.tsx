import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShopCard } from '@/components/ShopCard';

describe('ShopCard like button', () => {
  it('does not render a like button and preserves the shop card content and navigation', () => {
    const onOpen = vi.fn();
    const onToggleLike = vi.fn((event: React.MouseEvent<HTMLButtonElement>, _shopId: string) => {
      event.stopPropagation();
    });

    render(
      <ShopCard
        shop={{
          id: 'shop-1',
          shop_name: 'Sample Shop',
          location: 'Delhi',
          description: 'Sample description',
        }}
        rating={4.5}
        reviewCount={2}
        gallery={['https://photos.test/shop.jpg']}
        isLiked={false}
        onToggleLike={onToggleLike}
        onOpen={onOpen}
      />,
    );

    expect(screen.queryByRole('button', { name: /like|unlike/i })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sample Shop' })).toHaveAttribute(
      'src',
      'https://photos.test/shop.jpg',
    );
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sample Shop' })).toBeInTheDocument();
    expect(screen.getByText('Delhi')).toBeInTheDocument();
    expect(screen.getByText('Sample description...')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Sample description...').closest('button')!);
    expect(onOpen).toHaveBeenCalledWith('shop-1', 'https://photos.test/shop.jpg');

    onOpen.mockClear();
    fireEvent.click(screen.getByText('Visit').closest('button')!);
    expect(onOpen).toHaveBeenCalledWith('shop-1', 'https://photos.test/shop.jpg');
    expect(onToggleLike).not.toHaveBeenCalled();
  });
});
