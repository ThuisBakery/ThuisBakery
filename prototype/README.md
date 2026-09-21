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

- **F, Illustrated menu**: the current one, and the default. Each Category
  is a photograph with its name, line and price. No separate gallery.
- **A, Menu Card**: type-led, kept for comparison.

Superseded, still reachable by URL: `?variant=B` (rejected as a cliche),
`?variant=C` (the Estimate component, not for a homepage), `?variant=D`
(first merge, builder-on-homepage), `?variant=E` (menu and photo wall as
separate sections, rejected).

The moon and sun button on that bar forces light or dark, so both modes can
be compared. The real site would ship `prefers-color-scheme` alone.

Photography is `loremflickr` tagged `cake`, pinned to 640x480 because the
service silently returns a default "no result" image at larger sizes and
high lock values. So the stand-ins are cakes, but soft on large surfaces.
Jana's real photographs replace them.
