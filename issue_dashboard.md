Title: Consolidate 'Quick Stats' into Swipeable Cards on Mobile

Body: The new 'Humor' and 'Ghost Periods' metrics are great, but the Quick Stats grid is getting quite long on mobile screens. We should consider wrapping the Quick Stats section in a horizontal swipeable container (carousel) for viewports under 768px.
Why it matters: Improves mobile UX significantly by reducing vertical scroll fatigue, making the dashboard feel more app-like.
Rough approach: Apply CSS `display: flex; overflow-x: auto; scroll-snap-type: x mandatory;` to the grid container in a media query, and set child cards to `scroll-snap-align: start`.
