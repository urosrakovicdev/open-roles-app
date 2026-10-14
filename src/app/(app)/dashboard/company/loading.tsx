// Loading UI for the Company page. Each segment that reads the session needs its OWN
// boundary: the parent dashboard/loading.tsx covers the first load, but
// navigating between sibling pages needs one in the destination segment
// (Next 16.3+ instant-navigation validation). Shapes match the page.
// Docs: https://nextjs.org/docs/messages/blocking-prerender-dynamic

import {
  FormSkeleton,
  HeadingSkeleton,
  SkeletonPage,
} from "@/components/skeletons"

export default function Loading() {
  return (
    <SkeletonPage className="max-w-2xl">
      <HeadingSkeleton />
      <FormSkeleton fields={4} />
    </SkeletonPage>
  )
}
