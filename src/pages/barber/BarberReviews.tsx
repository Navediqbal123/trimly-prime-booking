import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
}

async function fetchMyReviews(): Promise<Review[]> {
  const { supabase } = await import('@/lib/supabase');
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch('https://saloon-backend-gp4v.onrender.com/api/reviews/my-reviews', {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex shrink-0 gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export default function BarberReviews() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['myReviews'],
    queryFn: fetchMyReviews,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-0 space-y-6 bg-background text-foreground"
    >
      <div>
        <h1 className="mb-2 text-3xl font-display font-bold text-foreground">
          My <span className="gradient-text">Reviews</span>
        </h1>
        <p className="text-muted-foreground">See what your clients are saying</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-card text-card-foreground">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !reviews?.length ? (
        <Card className="border-border bg-card text-card-foreground">
          <CardContent className="p-12 text-center">
            <Star className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No reviews yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Reviews from your clients will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="border-border bg-card text-card-foreground transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                      {review.client_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{review.client_name}</p>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="break-words text-sm text-muted-foreground">{review.comment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
