# OpenRoles

A job board: companies publish openings, candidates browse and apply. This
glossary exists because the product name and the public URLs use the word
"roles" for two unrelated things — the thing being advertised, and a user's
permission level. One of them had to give up the word.

## Language

**Job**:
A single opening advertised by a Company. The entity behind `/roles/[slug]`.
_Avoid_: Role, Listing, Posting, Vacancy, Opening

**Role**:
A user's permission level — Candidate, Employer, or Admin. Never a Job.
_Avoid_: Account type, User type, Permission, Membership

> The public URLs (`/roles`, `/roles/[slug]`) deliberately say "roles" and mean
> Jobs. This is the one place the two diverge: "roles" is the better marketing
> word and the URLs are SEO-load-bearing, so the URL surface keeps it and the
> code does not. In code, DB, DTOs, commit messages and docs, a Job is a Job.

**Board**:
The public, searchable list of published Jobs.
_Avoid_: Feed, Index, Listings page, Search page

**Company**:
The employer-side organisation a Job belongs to. Owned by exactly one Employer.
_Avoid_: Organisation, Employer (the Employer is the person, not the company)

**Application**:
A Candidate's submission to one Job. At most one per Candidate per Job.
_Avoid_: Submission, Apply, Candidacy

## Roles

**Candidate**:
A user who browses the Board and applies to Jobs. The default Role.
_Avoid_: Applicant, Job seeker, User

**Employer**:
A user who owns a Company and publishes Jobs under it.
_Avoid_: Recruiter, Poster, Hiring manager

**Admin**:
A user who moderates Jobs and users across all Companies.
_Avoid_: Moderator, Superuser, Staff

## Job lifecycle

**Draft**:
A Job that exists but has never been made public.
_Avoid_: Unpublished, Pending, Private

**Published**:
A Job the owning Employer has made public and which is accepting Applications.
Listed on the Board.
_Avoid_: Live, Active, Open

**Closed**:
A Job that is no longer accepting Applications. Still reachable at its public
URL — only the Board excludes it.
_Avoid_: Expired, Archived, Filled, Ended

**Public Job**:
A Job reachable at its public URL: Published or Closed. Never a Draft. This is
the boundary the public read path enforces.
_Avoid_: Live job, Visible job, Active job

**Work mode**:
Where a Job is performed: remote, hybrid, or onsite.
_Avoid_: Remote (as a field name — it cannot also mean "onsite"), Location type,
Arrangement, Setup
