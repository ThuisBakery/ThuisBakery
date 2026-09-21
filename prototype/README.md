# Prototype: design direction

Throwaway. Built to answer [Define the design direction](https://github.com/ThuisBakeryTech/ThuisBakery/issues/13).
Not production code, and not the spec. The spec is the resolution comment on that issue.

```
npm install
npm run dev
```

Then open `http://localhost:3000/prototype/design-direction?variant=A`

Variants, switchable from the floating bar at the bottom (or the left and
right arrow keys):

- **D, Menu Card + conversation**: the merge, and the default. A's register
  with a hero photograph, plus C's fact band, Estimate and FAQ.
- **A, Menu Card**: type-led. Jana's printed menu becomes the site.
- **C, The Conversation**: enquiry-first. The Estimate from #11 on the homepage.

**B, The Table** was rejected in review as a cliche. It is still in the code
on this branch (`?variant=B`) but is out of the switcher rotation.

The moon and sun button on that bar forces light or dark, so both modes can
be compared. The real site would ship `prefers-color-scheme` alone.

Photography is `loremflickr` tagged `cake`, pinned to 640x480 because the
service silently returns a default "no result" image at larger sizes and
high lock values. So the stand-ins are cakes, but soft on large surfaces.
Jana's real photographs replace them.
