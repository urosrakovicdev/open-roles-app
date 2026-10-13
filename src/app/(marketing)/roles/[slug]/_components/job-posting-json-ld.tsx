// schema.org JobPosting structured data for a Job page — what search engines
// read for job results. Closed Jobs keep their page (ADR-0005) and get a
// `validThrough` in the past, which marks the posting expired.
// Docs: https://nextjs.org/docs/app/guides/json-ld
//       https://developers.google.com/search/docs/appearance/structured-data/job-posting

import type { JobDetailDTO } from "@/data/dto"

const EMPLOYMENT_TYPE: Record<JobDetailDTO["type"], string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  contract: "CONTRACTOR",
  internship: "INTERN",
}

export function JobPostingJsonLd({ job }: { job: JobDetailDTO }) {
  const salary =
    job.salaryMin || job.salaryMax
      ? {
          "@type": "MonetaryAmount",
          currency: "USD", // formatSalary() displays dollars
          value: {
            "@type": "QuantitativeValue",
            ...(job.salaryMin && { minValue: job.salaryMin }),
            ...(job.salaryMax && { maxValue: job.salaryMax }),
            unitText: "YEAR",
          },
        }
      : undefined

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt?.toISOString(),
    ...(job.closedAt && { validThrough: job.closedAt.toISOString() }),
    employmentType: EMPLOYMENT_TYPE[job.type],
    hiringOrganization: {
      "@type": "Organization",
      name: job.company.name,
      ...(job.company.websiteUrl && { sameAs: job.company.websiteUrl }),
    },
    ...(job.location && {
      jobLocation: {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: job.location },
      },
    }),
    ...(job.workMode === "remote" && { jobLocationType: "TELECOMMUTE" }),
    ...(salary && { baseSalary: salary }),
    identifier: {
      "@type": "PropertyValue",
      name: job.company.name,
      value: job.slug,
    },
  }

  return (
    <script
      type="application/ld+json"
      // Escape "<" so a Job description can't close the script tag (XSS).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  )
}
