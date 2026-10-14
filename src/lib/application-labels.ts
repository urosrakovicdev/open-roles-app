// Display labels + badge tones for Application statuses. Pure data — safe on
// server and client. The values mirror the application_status DB enum.

import type { BadgeTone } from "@/components/ui/badge"
import type { ApplicationStatus } from "@/data/dto"

export const APPLICATION_STATUSES: {
  value: ApplicationStatus
  label: string
  tone: BadgeTone
}[] = [
  { value: "submitted", label: "Submitted", tone: "neutral" },
  { value: "reviewing", label: "In review", tone: "brand" },
  { value: "accepted", label: "Accepted", tone: "success" },
  { value: "rejected", label: "Not selected", tone: "danger" },
]

export function applicationStatusInfo(status: ApplicationStatus) {
  return APPLICATION_STATUSES.find((s) => s.value === status)!
}
