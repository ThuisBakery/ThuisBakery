# Prototype: design direction

Throwaway. Built to answer [Define the design direction](https://github.com/ThuisBakeryTech/ThuisBakery/issues/13).
Not production code, and not the spec. The spec is the resolution comment on that issue.

```
npm install
npm run dev
```

Then open `http://localhost:3000/prototype/design-direction?variant=A`

Three variants, switchable from the floating bar at the bottom (or the left
and right arrow keys):

- **A, Menu Card**: type-led. Jana's printed menu becomes the site.
- **B, The Table**: photography-led editorial. The cakes carry the page.
- **C, The Conversation**: enquiry-first. The Estimate from #11 sits on the homepage.

The moon and sun button on that bar forces light or dark, so both modes can
be compared. The real site would ship `prefers-color-scheme` alone.

Photography is `picsum.photos`, so the images are landscapes, not cakes.
That is deliberate: Jana's real photographs are still being edited, and the
design has to tolerate placeholders.
