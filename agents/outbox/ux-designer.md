# Outbox: UI/UX Designer

> Design specs, UI audits, and implementation reviews. Most recent at the top.

---

## [UX-004] Design Review — Provider Profile Business Image Upload UI

**Date**: 2026-02-21
**Feature**: FEAT-003
**File**: `src/pages/provider/ProviderProfile.tsx` (lines 393-434)

### Verdict: APPROVED with minor suggestions

The business image upload section is well-implemented and clearly separated from the profile photo. The two-step flow (select file -> click Upload) is appropriate for an S3 upload operation.

**What works well:**
- **Label is clear**: "Business Image" with helper text "Banner image shown on service listings and your provider page" — providers know exactly what this is for
- **Preview dimensions**: `w-full h-40 object-cover rounded-lg` — matches the banner proportions users will see on service cards
- **Button copy is context-aware**: Changes from "Select Image" to "Change Image" after selection
- **Upload is a separate step**: "Upload Image" button only appears after file selection — prevents accidental uploads
- **Feedback states are complete**: Loading ("Uploading..."), success toast, error toast with message, disabled state during upload
- **Visually distinct from profile photo**: Profile photo is in the blue header as a small circle; business image section is in the white content area as a wide rectangle. No confusion between the two.
- **Client-side validation**: File type and 5MB size limit checked before upload

**Suggestions (non-blocking):**

1. **Add a placeholder area when no image exists** — Currently, first-time uploaders see only a label and "Select Image" button with no visual cue about what size/shape the image should be. Add a dashed-border placeholder (`border-2 border-dashed border-gray-300 rounded-lg h-40 flex items-center justify-center`) with text like "Upload a banner image (recommended: 1200x400px)" to guide providers.

2. **Clear preview and invalidate query on success** — After successful upload, `businessImagePreview` stays as the local data URL and the provider query is not invalidated. The provider won't see the S3 URL until they refresh. Add `setBusinessImagePreview(null)` and `queryClient.invalidateQueries(['providerProfile'])` on success.

3. **No remove option** — Once a business image is uploaded, it can only be replaced, not removed. Low priority but worth adding a small "Remove" link in a future iteration.

---

## [UX-003] Design Review — Car Mechanic Rebrand (Home + Services + ProviderProfile)

**Date**: 2026-02-21
**Feature**: FEAT-005
**Files**: `src/pages/Home.tsx`, `src/pages/Services.tsx`, `src/pages/provider/ProviderProfile.tsx`

### Verdict: APPROVED with one change request

**What works well:**
- **All 6 car mechanic categories present on Home** (line 24-31): Engine & Mechanical, Body & Paint, Electrical & Diagnostics, Tyres & Wheels, Air Conditioning, Servicing & MOT — all with correct MUI icons
- **Category tiles are clickable Links** to `/services?category=<name>` — good information architecture
- **Hero copy is car-specific**: "Book your next car service", "Find trusted mechanics and garages near you", "Join as a Mechanic"
- **Brand consistency**: "Why Choose Zenith?" and "who trust Zenith" — no more Mawaad/BookEase confusion
- **Featured Garages section**: Correct car mechanic names (Mike's Auto Repair, City Body Shop, QuickFit Tyres) with relevant categories. Build icon placeholder instead of Unsplash hotlinks.
- **Services.tsx filter chips**: Dynamic from API with correct icon mapping for all 6 categories
- **ProviderProfile.tsx**: Category dropdown loads from API, subcategories fetch per category, no Health & Wellness special-case logic remains
- **Feature descriptions updated**: "Find the perfect mechanic or garage based on your location, speciality, and budget" — correct domain language

**Change request:**

1. **Home.tsx:25-30 — Hardcoded service counts are misleading**: The category tiles show counts like "500+", "300+", "600+" — these are fabricated numbers. Since the Services page fetches real service counts, either: (a) fetch the actual count per category from the API and display it, or (b) **remove the count entirely** and just show the category name + icon. Option (b) is simpler and honest. Change `<p className="text-xs text-gray-500">{category.count} services</p>` to remove or replace with a generic label like "Browse" or omit that line.

**Minor note (non-blocking):**
- The Featured Garages cards use a gradient placeholder (`bg-gradient-to-br from-blue-100 to-blue-200`) with a large Build icon for all 3 providers. This looks fine as a temporary solution, but each card shows the same icon regardless of category. Consider varying the icon per provider's category (Palette for body shop, DonutLarge for tyres).

---

## [UX-002] Design Review — Business Image on Service Cards and Detail Modal

**Date**: 2026-02-21
**Feature**: FEAT-004
**Files**: `src/pages/Services.tsx` (lines 173-178), `src/components/modals/ServiceDetailModal.tsx` (lines 54-59, 122-131)

### Verdict: CHANGES NEEDED (1 required fix, 2 suggestions)

**What works well:**
- **Service card banner**: `w-full h-32 object-cover` — good proportions, not too tall, doesn't overwhelm the card content
- **Fallback**: `/placeholder.svg` when no business image — graceful degradation
- **Alt text**: Uses provider business name — accessible
- **Visual hierarchy on card**: Banner image → blue header (avatar + service name + category) → card content (description, price, rating). Clean three-tier structure.
- **Modal banner**: Business image shown above the blue provider header — consistent pattern with the card
- **Service-specific image**: Renders below description as "Service photo" only when `service.imageUrl` is set — secondary position is correct (business image is the primary brand visual, service image is supplementary)
- **Mobile layout**: Fixed `h-32` on cards ensures consistent layout at 375px. The 3-column grid collapses to 1-column on mobile, so the full-width banner works well.

**Required fix:**

1. **ServiceDetailModal.tsx:106 — Rating fallback still shows fake "4.8"**
   The modal's rating line still reads:
   ```
   {service.providerId?.averageRating?.toFixed(1) || '4.8'} ({service.providerId?.totalReviews || 0})
   ```
   This was fixed in Services.tsx and Providers.tsx (UX-ENG-003) to show a "New" badge when `totalReviews === 0`, but the **modal was missed**. Apply the same pattern: if `totalReviews === 0`, show `<Badge>New</Badge>` instead of stars.

**Suggestions (non-blocking):**

2. **Banner height consistency**: Cards use fixed `h-32` but the modal uses `max-h-40`. With `max-h-40`, a very short image could collapse below 160px, creating visual inconsistency. Consider using fixed `h-40` on the modal for consistent proportions.

3. **Lazy loading**: Service cards can number in the dozens. Add `loading="lazy"` to the business image `<img>` tags on the service cards for better scroll performance.

---

## [UX-001] Full UI Audit Report

**Date**: 2026-02-20
**Auditor**: Senior UI/UX Designer
**Scope**: All pages in `src/pages/` and key components in `src/components/`

---

### CRITICAL Issues

---

**UX-C01 | Home.tsx:51-82, 130-176 — Hardcoded fake provider data shows DOCTORS, not mechanics**
- **Page**: `src/pages/Home.tsx`
- **Description**: The "Top-Rated" section (line 134) is titled **"Top-Rated Doctors"** and displays hardcoded providers: "Dr. Sarah Johnson — Cardiology", "Dr. Michael Chen — Dermatology", "Dr. Emily Rodriguez — Pediatrics". This is a **car mechanic** platform. The images are Unsplash photos of doctors. The "Book Now" buttons on these cards have no click handler — they do nothing.
- **Impact**: First-time visitors will think this is a healthcare app, not a car mechanic booking platform. Non-functional buttons damage trust.
- **Fix**: Replace with car mechanic examples (e.g. "Mike's Auto Repair — Engine & Mechanical") using placeholder data or fetch real featured providers from the API. Add working navigation on "Book Now". Change section title to "Top-Rated Mechanics" or "Featured Garages".

---

**UX-C02 | Home.tsx:115, 184 — Brand name inconsistency: three different names on one page**
- **Page**: `src/pages/Home.tsx`
- **Description**: The features section says **"Why Choose Mawaad?"** (line 115). The CTA section says **"who trust BookEase"** (line 184). The header logo says **"Mawaad"**. The project is called **Zenith**. Three brand names on a single page.
- **Impact**: Destroys brand credibility. Users don't know what the app is called.
- **Fix**: Pick ONE brand name and use it everywhere. Update lines 115 and 184.

---

**UX-C03 | Header.tsx:79 — No mobile navigation at all**
- **Page**: `src/components/Layout/Header.tsx`
- **Description**: The nav element uses `hidden md:flex`, which hides ALL navigation links on screens below 768px. There is no hamburger menu, drawer, or any alternative mobile nav. Mobile users can only access pages via the avatar dropdown menu (which requires being logged in) or by typing URLs directly.
- **Impact**: The app is effectively unusable on mobile for unauthenticated users — they cannot reach Services, Login, or Register from the home page.
- **Fix**: Add a mobile hamburger menu icon (visible on `md:hidden`) that opens a slide-out drawer or sheet with all navigation links.

---

**UX-C04 | Home.tsx:21-26 vs Services.tsx:61-88 — Category mismatch between Home and Services**
- **Page**: `src/pages/Home.tsx`, `src/pages/Services.tsx`
- **Description**: Home shows **4** category tiles (Engine & Mechanical, Body & Paint, Electrical, Tyres & Wheels). Services shows **6** filter chips (adds Air Conditioning, Servicing & MOT). A user clicking "Electrical" on Home has no clear path to the Services page filtered by that category — the Home tiles are not clickable links.
- **Impact**: Confusing information architecture. Categories feel incomplete on Home. Tiles are decorative, not functional.
- **Fix**: (1) Add all 6 categories to Home. (2) Make each tile a `<Link to="/services?category=Engine+%26+Mechanical">`. (3) Services page reads the query param to pre-select the filter chip.

---

**UX-C05 | Home.tsx:87-109 — Hero section copy is generic, not domain-specific**
- **Page**: `src/pages/Home.tsx`
- **Description**: Hero says "Book your next appointment" and "Find and book with top-rated providers near you". For a car mechanic platform, this should mention cars, repairs, or mechanics. The "Join as Provider" CTA also doesn't specify what kind of provider.
- **Impact**: Landing page doesn't communicate what the app actually does.
- **Fix**: Change to e.g. "Book your next car service" / "Find trusted mechanics and garages near you" / "Join as a Mechanic".

---

**UX-C06 | Services.tsx:237-238 & Providers.tsx:395 — Fake 4.8 star rating for all providers**
- **Page**: `src/pages/Services.tsx`, `src/pages/Providers.tsx`
- **Description**: `service.providerId?.averageRating || 4.8` — providers with zero reviews display a 4.8 star rating. This is dishonest.
- **Impact**: Users cannot trust ratings. New providers appear highly rated.
- **Fix**: If `averageRating` is 0 or null and `totalReviews` is 0, show "New" badge instead of a fake rating. Only display stars when there are actual reviews.

---

### MAJOR Issues

---

**UX-M01 | Services.tsx:139-141 — Search placeholder says "treatments"**
- **Page**: `src/pages/Services.tsx`
- **Description**: Placeholder text: "Search services, providers, or **treatments**..." — "treatments" is medical terminology.
- **Fix**: Change to "Search services, providers, or repairs..."

---

**UX-M02 | Services.tsx:259-264 — "Load More" button has no functionality**
- **Page**: `src/pages/Services.tsx`
- **Description**: The "Load More Services" button renders whenever services exist but has no click handler, no pagination state, and no loading indicator. It's a dead button styled as primary.
- **Impact**: Users click it expecting more results, nothing happens.
- **Fix**: Either implement pagination with the API or remove the button entirely.

---

**UX-M03 | Services.tsx:166-169 — "More Filters" button does nothing**
- **Page**: `src/pages/Services.tsx`
- **Description**: "More Filters" button is rendered but has no `onClick` handler or filter sheet/modal.
- **Fix**: Either connect to a filter drawer (like Providers.tsx has) or remove the button.

---

**UX-M04 | Profile.tsx:399 — Client profile label says "Business Address"**
- **Page**: `src/pages/Profile.tsx`
- **Description**: The address field label uses `t('profile.businessAddress')` which translates to "Business Address". This is the CLIENT profile page — clients don't have a business address.
- **Fix**: Change to `t('profile.address')` or "Address".

---

**UX-M05 | Dashboard.tsx:250-254 — Empty stats section for client users**
- **Page**: `src/pages/Dashboard.tsx`
- **Description**: The stats grid section applies `max-w-md mx-auto` for client users but renders NO stat cards at all. This creates an empty gap at the bottom of the page.
- **Impact**: Client dashboard feels unfinished — just upcoming bookings and activity with wasted space below.
- **Fix**: Either add client-relevant stats (total bookings, upcoming count, last visit date) or remove the stats grid section entirely for client users.

---

**UX-M06 | Providers.tsx:426 & ProviderDetail.tsx:164 — "Verified" badge shown for ALL providers unconditionally**
- **Page**: `src/pages/Providers.tsx`, `src/pages/ProviderDetail.tsx`
- **Description**: Every provider card and detail page shows a green "Verified" badge regardless of actual verification status. Line 426 renders it with no condition.
- **Impact**: "Verified" loses meaning if everyone has it. Misleads users about trust signals.
- **Fix**: Only show "Verified" badge when the provider has a verified status field (`provider.isVerified === true`).

---

**UX-M07 | Profile.tsx:306, 476 — Inconsistent card rounding**
- **Page**: `src/pages/Profile.tsx`
- **Description**: The profile header card uses `rounded-none`, the schedule card uses `rounded-none`, but the profile info card in between has default rounding. This creates a visually jarring layout.
- **Fix**: Apply consistent rounding to all cards. Recommend removing `rounded-none` to match the app's default card styling.

---

**UX-M08 | Home.tsx:171 — "Book Now" buttons on fake provider cards do nothing**
- **Page**: `src/pages/Home.tsx`
- **Description**: The "Book Now" button inside the hardcoded provider cards has no `onClick` handler. Clicking it does nothing.
- **Fix**: When provider data becomes real, link to `/provider/:id`. For now, link to `/services`.

---

**UX-M09 | Register.tsx:86 — Success message says "BookEase"**
- **Page**: `src/pages/Register.tsx`
- **Description**: After successful registration, the toast says "Welcome to BookEase!" — wrong brand name.
- **Fix**: Update to the correct app brand name.

---

**UX-M10 | Login.tsx — No "Forgot Password" link**
- **Page**: `src/pages/Login.tsx`
- **Description**: The login page has no password recovery flow. Users who forget their password have no way to reset it.
- **Fix**: Add a "Forgot password?" link below the password field. Even if the backend flow isn't built yet, the link should exist (can go to a "coming soon" page).

---

**UX-M11 | No footer anywhere in the app**
- **Page**: All pages
- **Description**: No page has a footer. There are no links to: about page, contact info, terms of service, privacy policy, or social media.
- **Impact**: Missing standard web conventions. Reduces trust for a booking platform.
- **Fix**: Add a shared `<Footer>` component to the layout with essential links.

---

**UX-M12 | ProviderSchedule.tsx — No time validation (endTime can be before startTime)**
- **Page**: `src/pages/provider/ProviderSchedule.tsx`
- **Description**: A provider can set a slot like 17:00 to 09:00 without any error. The form does not validate that end time is after start time.
- **Fix**: Add validation on blur or on save that checks `endTime > startTime`. Show inline error message.

---

**UX-M13 | MyBookings.tsx — No confirmation dialog before cancelling a booking**
- **Page**: `src/pages/MyBookings.tsx`
- **Description**: The cancel button immediately cancels the booking with no "Are you sure?" confirmation. One accidental click can cancel an appointment.
- **Fix**: Add a confirmation dialog before executing cancellation.

---

### MINOR Issues

---

**UX-N01 | Profile.tsx:191 — Debug comment "//88888888" left in code**
- **Page**: `src/pages/Profile.tsx:191`
- **Fix**: Remove the comment.

---

**UX-N02 | Header.tsx:19, ProviderProfile.tsx:59-65,96-97,103-121,139,253-275 — Console.log statements left in production code**
- **Pages**: Multiple
- **Description**: Extensive `console.log` debugging left throughout Header, ProviderProfile, and Profile pages.
- **Fix**: Remove all debug logging.

---

**UX-N03 | Colour inconsistency — #025bae vs #4a90e2**
- **Pages**: Dashboard.tsx, ProviderDetail.tsx, ProviderServices.tsx
- **Description**: Primary brand colour is `#025bae`, but several secondary headers use `#4a90e2` without documented reasoning. The lighter blue creates visual inconsistency.
- **Fix**: Define a colour hierarchy (primary: `#025bae`, secondary/muted: `#4a90e2`) in the design system and document it, OR consolidate to one shade.

---

**UX-N04 | Inline `style={{}}` overuse instead of Tailwind classes**
- **Pages**: Nearly every page
- **Description**: `style={{backgroundColor: '#025bae'}}` is used on dozens of elements instead of `bg-[#025bae]` or a CSS variable.
- **Impact**: Harder to maintain, can't be overridden by Tailwind utilities, not searchable.
- **Fix**: Define `--color-brand: #025bae` in `src/index.css` and use `bg-[var(--color-brand)]` or add to `tailwind.config`. Alternatively, use `bg-[#025bae]` directly.

---

**UX-N05 | Font family hardcoded inline in some headers but not others**
- **Pages**: Dashboard.tsx:84, Profile.tsx:320, Providers.tsx:161, ProviderServices.tsx:299
- **Description**: `fontFamily: 'Red Hat Display, system-ui, -apple-system, sans-serif'` appears as inline style on some page titles but not others.
- **Fix**: If Red Hat Display is the heading font, set it in `tailwind.config` as `font-display` and use `font-display` class consistently on all headings.

---

**UX-N06 | TimeSlotPicker.tsx — Time slot grid cramped on mobile**
- **Page**: `src/components/booking/TimeSlotPicker.tsx`
- **Description**: Time slot buttons use `grid-cols-3` on all screen sizes. On a 375px screen, each button becomes very narrow and hard to tap.
- **Fix**: Use `grid-cols-2 sm:grid-cols-3` for better mobile touch targets.

---

**UX-N07 | Register.tsx — Role selector layout doesn't adapt to mobile**
- **Page**: `src/pages/Register.tsx`
- **Description**: RadioGroup items use `flex space-x-6` which doesn't stack on mobile. On narrow screens the options are cramped.
- **Fix**: Use `flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0`.

---

**UX-N08 | ProviderProfile.tsx:394-402 — Remove photo button commented out**
- **Page**: `src/pages/provider/ProviderProfile.tsx`
- **Description**: The "remove profile photo" button is commented out with no explanation. Providers cannot remove their photo once uploaded.
- **Fix**: Either uncomment and style properly, or document why it's disabled.

---

**UX-N09 | Home.tsx:142-148 — External Unsplash image URLs**
- **Page**: `src/pages/Home.tsx`
- **Description**: Provider images are hotlinked from Unsplash (`https://images.unsplash.com/...`). These can break due to rate limits or URL changes.
- **Fix**: Download and serve images locally from `/public/` or use the API to fetch real featured providers.

---

**UX-N10 | No global error boundary / 404 page**
- **Pages**: App routing
- **Description**: If a user navigates to an undefined route, there's no visible 404 page. No global error boundary catches rendering errors.
- **Fix**: Add a catch-all route with a styled 404 page. Add React error boundary with user-friendly messaging.

---

### Summary Table

| ID | Severity | Page | Issue |
|---|---|---|---|
| UX-C01 | Critical | Home.tsx | Fake doctor data, not mechanics |
| UX-C02 | Critical | Home.tsx | Three different brand names |
| UX-C03 | Critical | Header.tsx | No mobile navigation |
| UX-C04 | Critical | Home.tsx, Services.tsx | Category mismatch, tiles not clickable |
| UX-C05 | Critical | Home.tsx | Generic hero copy, not car-specific |
| UX-C06 | Critical | Services.tsx, Providers.tsx | Fake 4.8 rating for all providers |
| UX-M01 | Major | Services.tsx | "treatments" in search placeholder |
| UX-M02 | Major | Services.tsx | Dead "Load More" button |
| UX-M03 | Major | Services.tsx | Dead "More Filters" button |
| UX-M04 | Major | Profile.tsx | "Business Address" on client profile |
| UX-M05 | Major | Dashboard.tsx | Empty stats section for clients |
| UX-M06 | Major | Providers.tsx, ProviderDetail.tsx | Unconditional "Verified" badge |
| UX-M07 | Major | Profile.tsx | Inconsistent card rounding |
| UX-M08 | Major | Home.tsx | Dead "Book Now" buttons |
| UX-M09 | Major | Register.tsx | Wrong brand name "BookEase" |
| UX-M10 | Major | Login.tsx | No forgot password link |
| UX-M11 | Major | All pages | No footer |
| UX-M12 | Major | ProviderSchedule.tsx | No time validation |
| UX-M13 | Major | MyBookings.tsx | No cancel confirmation |
| UX-N01 | Minor | Profile.tsx | Debug comment "//88888888" |
| UX-N02 | Minor | Multiple | Console.log left in code |
| UX-N03 | Minor | Multiple | Colour inconsistency |
| UX-N04 | Minor | Multiple | Inline styles vs Tailwind |
| UX-N05 | Minor | Multiple | Inconsistent font family |
| UX-N06 | Minor | TimeSlotPicker.tsx | Grid cramped on mobile |
| UX-N07 | Minor | Register.tsx | Role selector layout on mobile |
| UX-N08 | Minor | ProviderProfile.tsx | Commented-out remove photo button |
| UX-N09 | Minor | Home.tsx | External Unsplash image URLs |
| UX-N10 | Minor | App routing | No 404 page or error boundary |

**Total**: 6 Critical, 13 Major, 10 Minor

---

**Status**: UX-001 audit complete. Ready for Tech Lead triage (see UX-005).
