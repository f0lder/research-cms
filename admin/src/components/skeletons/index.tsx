'use client';

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 p-3 bg-white border border-zinc-100 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-200 rounded w-3/4" />
            <div className="h-3 bg-zinc-100 rounded w-1/2" />
          </div>
          <div className="w-20 h-8 bg-zinc-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 rounded w-24 mb-2" />
        <div className="h-10 bg-zinc-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 rounded w-24 mb-2" />
        <div className="h-10 bg-zinc-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-zinc-200 rounded w-24 mb-2" />
        <div className="h-32 bg-zinc-100 rounded" />
      </div>
      <div className="h-10 bg-zinc-300 rounded w-32" />
    </div>
  );
}

export function CardGridSkeleton({ cols = 2, cards = 6 }: { cols?: number; cards?: number }) {
  return (
    <div className={`grid grid-cols-${cols} gap-4`}>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="p-4 bg-white border border-zinc-100 rounded animate-pulse">
          <div className="h-32 bg-zinc-200 rounded mb-3" />
          <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-zinc-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="h-8 bg-zinc-200 rounded w-1/2 mb-2" />
      <div className="h-4 bg-zinc-100 rounded w-1/3" />
    </div>
  );
}

export function SectionsSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-zinc-200 p-4 animate-pulse">
          <div className="h-4 bg-zinc-200 rounded w-32 mb-4" />
          <div className="space-y-3">
            <div className="h-10 bg-zinc-100 rounded" />
            <div className="h-10 bg-zinc-100 rounded" />
            <div className="h-8 bg-zinc-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-6 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square bg-zinc-100 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 bg-white border border-zinc-100 rounded animate-pulse flex justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-200 rounded w-1/2" />
            <div className="h-3 bg-zinc-100 rounded w-1/3" />
          </div>
          <div className="w-16 h-8 bg-zinc-200 rounded" />
        </div>
      ))}
    </div>
  );
}
