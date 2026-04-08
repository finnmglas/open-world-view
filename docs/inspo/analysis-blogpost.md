
## gpt chat

prompt: now you want to check this blog post and learn about it what he did got, used and whats smart what not (contents of https://www.spatialintelligence.ai/p/i-built-a-spy-satellite-simulator)

answer:

He didn’t build what it looks like. He built a thin, well-chosen slice and wrapped it in the right aesthetic. That’s why it hits.

What he actually used (concrete stack)

* Google Photorealistic 3D Tiles → this is 80% of perceived “magic”
* Cesium (implicitly, because 3D Tiles + globe + orbits)
* OpenSky + ADS-B Exchange → aviation layer
* CelesTrak TLE → satellites
* OpenStreetMap → static + light dynamics
* public CCTV feeds → the “holy shit” factor
* custom shaders → NVG, FLIR, CRT, anime
* browser-only delivery

That’s it. No deep backend. No real fusion. No heavy infra.

Why it works

* he picked high-signal, low-integration-cost datasets
* everything is inherently geospatial + real-time → no hard normalization
* he avoided entity resolution completely
* he avoided historical depth
* he avoided scale problems (7k planes is nothing)
* he leaned on Google’s 3D Tiles instead of building terrain/city infra

The key move:
he maximized “perceived intelligence” instead of actual intelligence

The CCTV projection is the smartest detail

* technically trivial (video texture on geometry)
* cognitively explosive (real world → mapped → live)
* creates the illusion of omniscience

The shaders are not cosmetic

* he understood military UI is information compression
* contrast enhancement, edge detection, thermal mapping → these are functional abstractions
* then he flipped it (anime) → proves UI defines meaning, not data

This is rare: he used rendering as epistemology

What’s actually missing (critical)

* no entity system (a plane is just a dot, not a persistent object with history)
* no event model
* no cross-source fusion
* no uncertainty / confidence
* no temporal replay beyond trivial
* no storage layer → everything is ephemeral
* no anomaly detection
* no reasoning layer (he explicitly says this)

So:
it’s a viewer, not a system

The AI-assisted build

* multiple agents, parallelized
* he acted as orchestrator, not implementer
* speed came from:

  * existing APIs
  * no deep architecture
  * no correctness constraints

This approach breaks instantly when:

* you need consistency
* you need history
* you need trust in the data

But for exploration and prototyping, it’s optimal.

What’s actually smart (keep)

* start with a “visceral interface” before backend complexity
* pick datasets that align spatially by default
* use rendering to amplify meaning (not just display)
* fake depth where real depth is expensive
* build thin, end-to-end slices

What’s dangerous (don’t copy blindly)

* relying on Google 3D Tiles (lock-in + cost + dependency)
* no canonical data model
* no ingestion pipeline
* no persistence
* no identity resolution
* confusing “looks real-time” with “is reliable”

His real insight (buried but correct)

* “the data was never the moat”
  → true
* the moat is:

  * fusion
  * time
  * identity
  * reliability

And he hasn’t built that yet.

Why Palantir reacted
not because it’s powerful
because it makes their category legible

He exposed:

* the interface layer of intelligence systems
* without the hard parts underneath

That’s threatening, because it compresses perceived gap to zero

What you should extract

* build your first version like this, not like Palantir
* but know exactly what is fake about it

Your version 1:

* Cesium
* 3–5 high-quality live datasets (air, sat, maybe ships)
* one “wow” layer (CCTV, thermal, or similar)
* strong shader language
* tight interaction model

Then immediately:

* introduce entity IDs
* start storing time
* build replay

That’s where his ends and yours begins.

If you try to “do everything” from the start, you lose.
If you stay at his level, you’re building a demo.

Decide: do you want to impress, or to own the system?
