# 01 · Product brief

## What OpenRoles is

A **job board**. Companies publish Jobs; candidates browse and apply. It has a
public, SEO-facing half (cached, server-rendered) and a private, authenticated
half (dynamic, per-user).

## Users (Roles)

- **Candidate** (default) — browse/search Jobs, apply, track Applications.
- **Employer** — create a Company, post/edit/publish/close Jobs, review
  Applications to their Jobs.
- **Admin** — moderate Jobs and users across all Companies.

Signup lets a user pick Candidate or Employer. Admin is assigned only by seed or
by another Admin.

## Core features

1. **Public board** — list Published Jobs with **search** (keyword), **filters**
   (employment type, work mode) and **pagination**.
2. **Job detail page** — shareable, SEO-optimized, cached, with an Apply action.
   Closed Jobs stay reachable with a "no longer accepting applications" state.
3. **Company profile** — public page listing a Company's Published Jobs.
4. **Auth** — sign up / log in with email + password, JWT sessions, Role chosen
   at signup.
5. **Employer dashboard** — manage the Company; post a Job (draft → publish),
   edit, close, delete; see and triage Applications to their Jobs.
6. **Candidate dashboard** — your Applications and their status.
7. **Admin console** — close/remove any Job, change user Roles.
8. **Settings** — update name, change password.

## Pages / routes

```
/                             landing (static)
/roles                        public board — search/filter/pagination
/roles/[slug]                 Job detail (cached, SEO, Apply)
/companies/[slug]             company profile (cached)
/login  /signup               auth
/dashboard                    role-aware home (private)
/dashboard/company            create/edit my Company (employer)
/dashboard/roles              my Jobs (employer)
/dashboard/roles/new          post a Job (employer)
/dashboard/roles/[id]/edit    edit a Job (employer, owner-only)
/dashboard/applications       Applications (candidate or employer view)
/dashboard/settings           profile + password
/admin                        moderation (admin)
/api/auth/[...nextauth]       Auth.js
/api/webhooks/stripe          stretch: featured-Job payment webhook
```

## Explicitly out of scope

Messaging/chat, real payments beyond the stretch webhook, search-as-a-service,
i18n, email verification / password reset, a full design system. Add them only
after the core slice works and the human asks.
