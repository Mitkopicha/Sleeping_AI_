<div align="center">

# 🌙 Sleeping AI 🌙

**Sleeping AI is a web app that generates and narrates AI-generated bedtime stories for adults, helping users improve their sleep quality.**

</div>

---

## About

Sleeping AI is a web application that turns a topic of your choice into a personalised bedtime
story, narrated in a soothing AI voice with optional ambient background music. Pick a theme
like *Science*, *Philosophy* or *History* — or type your own — choose a summary, set the length
and voice, and let the story play you to sleep.

Built as a flagship project during my internship at **Z Studio**, where I served as **Project
Manager** leading a 5-person cross-functional team through the full product lifecycle from
requirements and objectives through to a working, launch ready implementation.

Live Figma prototype: (https://www.figma.com/design/sqHvB0VDElGyrD5lcwO3uG/SX-PROJECT-PROTOTYPE?node-id=0%3A1&t=XXXXX)

## Screenshots 
| Home — Topic Selection | Story Generation |
<img width="900" height="515" alt="Screenshot 2026-07-20 175832" src="https://github.com/user-attachments/assets/d8a90308-2572-469d-878f-3760cdffcbe6" />



<img width="689" height="363" alt="topicpick" src="https://github.com/user-attachments/assets/fec16ab4-2e3e-4a89-b736-03e7a1cc5e30" />
<img width="941" height="440" alt="generated" src="https://github.com/user-attachments/assets/ff7ae2c9-bef4-4867-9b14-94caae75b7f3" />


| Credit Store | Settings |
<img width="892" height="488" alt="Screenshot 2026-07-20 175938" src="https://github.com/user-attachments/assets/8c330730-77e1-4174-9b26-38691cf9e476" />
<img width="932" height="529" alt="Screenshot 2026-07-20 175858" src="https://github.com/user-attachments/assets/3f1f51c7-1dd4-4b0e-acfb-4e050d82ffff" />

| | (screenshots/04-settings.png) |
<img width="917" height="529" alt="Screenshot 2026-07-20 175920" src="https://github.com/user-attachments/assets/a1f32efa-440c-48d7-a04d-63895a968776" />

**Library — Private & Community Stories**
<img width="892" height="488" alt="Screenshot 2026-07-20 175938" src="https://github.com/user-attachments/assets/aea2095a-917a-4638-b12e-199f26ca1723" />


## Features

- 🎯 **Topic picker** — curated categories or a custom topic of your own
- 🤖 **AI-generated stories** — multiple story summaries generated via the OpenAI API, pick your favourite
- 🔊 **Natural narration** — Google Cloud Text-to-Speech with configurable voice, gender and speaking rate
- 🎵 **Ambient soundscapes** — layer background audio under the narration, with volume control
- 💳 **Credit-based access** — free starter credits, with paid top-ups via Stripe
- 📚 **Private & community library** — save stories privately or share them with the community
- 🔐 **Secure accounts** — Firebase Authentication and Firestore-backed user data

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, React Router |
| Backend | Firebase Cloud Functions |
| AI / Voice | OpenAI API, Google Cloud Text-to-Speech |
| Database | Firestore |
| Storage | Firebase Storage |
| Payments | Stripe (via Firebase Functions) |

## My Role — Project Manager

- Owned backlog prioritisation, sprint planning and roadmap alignment across the team
- Defined product requirements, objectives and success metrics (engagement, retention, monetisation)
- Managed stakeholder communication and presented deliverables and milestones
- Coordinated Agile ceremonies across frontend, backend, QA and documentation workstreams
- Oversaw QA/testing coordination and supported technical documentation throughout delivery

## Running Locally

```bash
cd frontend
npm install
cp .env.example .env   # add your own Firebase project keys
npm run dev
```

The backend (`/backend/functions`) requires its own Firebase project plus API keys for
OpenAI, Google Cloud Text-to-Speech and Stripe, configured via Firebase environment
config or Secret Manager.

> **Note:** Firebase config values are loaded from environment variables (see
> `.env.example`) rather than hard-coded, so this repo is safe to keep public.
