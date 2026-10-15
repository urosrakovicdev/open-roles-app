// Loading UI for the dashboard home. Each segment that reads the session needs its OWN
// boundary: the parent dashboard/loading.tsx covers the first load, but
// navigating between sibling pages needs one in the destination segment
// (Next 16.3+ instant-navigation validation). Shapes match the page.
// Docs: https://nextjs.org/docs/messages/blocking-prerender-dynamic

import {
  CardListSkeleton,
  HeadingSkeleton,
  SkeletonPage,
  StatsSkeleton,
} from "@/components/skeletons"

export default function Loading() {
  return (
    <SkeletonPage>
      <HeadingSkeleton />
      <StatsSkeleton />
      <CardListSkeleton rows={2} />
    </SkeletonPage>
  )
}
