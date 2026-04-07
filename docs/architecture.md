# open-world-view architecture

This document is for collecting thoughts on how we structure the architecture and the related docs.

## containers

We use docker compose for an easy monorepo without hasssle.

- dbs: postgres (data) + qdrant (vectors)
- be: python fastapi for better data processing
- fe: nextjs shadcn tailwind zustand axios vercel

ports? we dont expose anything but fe by default would be my thought

proven stack, julias a be expert, finns a fe expert, and the dbs just work

## decisions not taken

- Auth? I dont think so
- Public deployment? I dont think so yet bc of be security taking time

Yeah thats it for this file, go back or expand it.