import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';

const clayCard =
  'border-0 bg-white shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]';

const claySkeleton =
  'bg-slate-100 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]';

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
        >
          <Card
            className={`${clayCard} overflow-hidden rounded-[30px]`}
          >
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 sm:p-5">
              <Skeleton
                className={`h-3.5 w-20 rounded-full sm:w-24 ${claySkeleton}`}
              />

              <Skeleton
                className={`h-12 w-12 rounded-full ${claySkeleton}`}
              />
            </CardHeader>

            <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
              <Skeleton
                className={`h-8 w-20 rounded-lg sm:h-9 ${claySkeleton}`}
              />
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
      <Card
        className={`${clayCard} overflow-hidden rounded-[34px]`}
      >
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Skeleton
              className={`h-11 w-11 rounded-full ${claySkeleton}`}
            />

            <div className="space-y-2">
              <Skeleton
                className={`h-5 w-32 rounded-full ${claySkeleton}`}
              />

              <Skeleton
                className={`h-3 w-20 rounded-full ${claySkeleton}`}
              />
            </div>
          </div>

          <Skeleton
            className={`h-9 w-24 rounded-full ${claySkeleton}`}
          />
        </CardHeader>

        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="flex h-[250px] items-end gap-3 px-2 sm:h-[300px] sm:gap-4 sm:px-4">
            {[45, 65, 38, 78, 55, 88, 68].map(
              (height, i) => (
                <motion.div
                  key={i}
                  className="
                    flex-1
                    rounded-t-[12px]
                    bg-orange-100
                    shadow-[inset_2px_2px_5px_rgba(255,255,255,0.9),inset_-2px_-2px_5px_rgba(0,0,0,0.05)]
                  "
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.5,
                  }}
                />
              ),
            )}
          </div>

          <div className="mt-4 flex justify-between px-2 sm:px-4">
            {[...Array(7)].map((_, i) => (
              <Skeleton
                key={i}
                className={`h-3 w-7 rounded-full ${claySkeleton}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TableSkeleton({
  rows = 3,
}: {
  rows?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card
        className={`${clayCard} overflow-hidden rounded-[30px]`}
      >
        <CardHeader className="flex flex-row items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Skeleton
              className={`h-11 w-11 rounded-full ${claySkeleton}`}
            />

            <div className="space-y-2">
              <Skeleton
                className={`h-5 w-28 rounded-full ${claySkeleton}`}
              />

              <Skeleton
                className={`h-3 w-20 rounded-full ${claySkeleton}`}
              />
            </div>
          </div>

          <Skeleton
            className={`h-10 w-24 rounded-[16px] ${claySkeleton}`}
          />
        </CardHeader>

        <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
          <div
            className="
              overflow-hidden
              rounded-[22px]
              bg-white
              shadow-[inset_2px_2px_6px_rgba(0,0,0,0.04),inset_-2px_-2px_6px_rgba(255,255,255,0.95)]
            "
          >
            {/* Header */}
            <div className="grid grid-cols-5 gap-3 border-b border-slate-100 px-4 py-3 sm:gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton
                  key={i}
                  className={`h-3.5 rounded-full ${claySkeleton}`}
                />
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {[...Array(rows)].map((_, rowIndex) => (
                <motion.div
                  key={rowIndex}
                  initial={{
                    opacity: 0,
                    x: -20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  transition={{
                    delay: rowIndex * 0.1,
                  }}
                  className="grid grid-cols-5 items-center gap-3 px-4 py-4 sm:gap-4"
                >
                  {[...Array(5)].map((_, i) => (
                    <Skeleton
                      key={i}
                      className={`h-3.5 rounded-full ${claySkeleton}`}
                    />
                  ))}
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 bg-white">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton
          className={`h-9 w-56 rounded-lg ${claySkeleton}`}
        />

        <Skeleton
          className={`h-4 w-72 rounded-full ${claySkeleton}`}
        />
      </div>

      {/* Stats */}
      <StatsCardsSkeleton />

      {/* Earnings Chart */}
      <ChartSkeleton />

      {/* Table */}
      <TableSkeleton rows={3} />
    </div>
  );
}