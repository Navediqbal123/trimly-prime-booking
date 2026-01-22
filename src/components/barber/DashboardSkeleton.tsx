import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end justify-around gap-2 px-4">
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                className="flex-1 bg-muted rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${Math.random() * 60 + 20}%` }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 py-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4" />
              ))}
            </div>
            {/* Rows */}
            {[...Array(rows)].map((_, rowIndex) => (
              <motion.div
                key={rowIndex}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.1 }}
                className="grid grid-cols-5 gap-4 py-3 border-t border-border"
              >
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4" />
                ))}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Stats Cards Skeleton */}
      <StatsCardsSkeleton />

      {/* Chart Skeleton */}
      <ChartSkeleton />

      {/* Table Skeleton */}
      <TableSkeleton rows={3} />
    </div>
  );
}
