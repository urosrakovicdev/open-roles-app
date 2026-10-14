// Loading UI for the admin console. Gives the page a <Suspense> boundary, so
// the per-request Role check (requireFreshAdmin in every admin read) streams
// in after the static shell. Shapes match the page.
// Docs: https://nextjs.org/docs/app/api-reference/file-conventions/loading

import {
  CardListSkeleton,
  HeadingSkeleton,
  SkeletonPage,
} from "@/components/skeletons"
import { Container } from "@/components/ui/container"

export default function Loading() {
  return (
    <Container className="py-10">
      <SkeletonPage>
        <HeadingSkeleton />
        <CardListSkeleton rows={4} />
      </SkeletonPage>
    </Container>
  )
}
