Review real rendered screenshots of a generated static tool site.

Return only structured JSON. Score each dimension from 0 to 10:
- visual_polish
- tool_clarity
- layout_hierarchy
- mobile_quality
- senior_friendliness
- uniqueness

Fail the review if:
- visual_polish < 7.5
- tool_clarity < 8
- mobile_quality < 8
- senior_friendliness < 7.5
- the first viewport is not a usable tool
- the page looks like a default browser form
- the page looks like an admin dashboard
- the page is a pure marketing landing page
- duplicate privacy or local-only cues appear in the same first-screen area
- the H1 and subtitle do not visually belong to one group
- the hero has large meaningless empty space
- section labels look like mechanical uppercase badges instead of unified UI tokens/cards
- the hero pushes the real calculator too low on the page
