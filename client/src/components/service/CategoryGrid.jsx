import React from 'react';
import ServiceCard from './ServiceCard';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import { Wrench } from 'lucide-react';

export default function CategoryGrid({
  categories = [],
  loading = false,
  onSelectCategory,
  className = '',
}) {
  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <Skeleton key={idx} variant="card" className="h-64" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No service categories available"
        description="We couldn't find any services matching your selection."
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
    >
      {categories.map((category) => (
        <ServiceCard
          key={category.id}
          category={category}
          onSelect={onSelectCategory}
        />
      ))}
    </div>
  );
}
