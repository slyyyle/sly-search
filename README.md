# SlySearch Frontend

**✨ Note: This frontend is under active development. While the backend is functional, frontend features are being implemented incrementally. Some UI elements might not be fully connected yet. ✨**

This repository contains the frontend application for SlySearch, a customizable search engine interface designed to work with its corresponding backend service.

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (built on Radix UI Primitives & Lucide Icons)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with localStorage persistence for settings)
*   **Schema Validation:** [Zod](https://zod.dev/)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Current Frontend State

*   **Core Search:** Homepage and Search Results page are functional, interacting with the backend search API.
*   **Result Layouts:** List, Grid, and Compact result layouts are implemented.
*   **Settings UI:** Most settings panels are present in the UI:
    *   General, Appearance, Advanced settings are mostly connected.
    *   Engine management, Privacy controls, and Personal Sources UI exist but might require further frontend implementation to fully utilize backend capabilities.
*   **API Interaction:** Frontend makes calls to backend endpoints for search (`/api/search`), settings (`/api/settings`), and health checks (`/api/health`).
*   **Theming:** Dark/light theme support is integrated.
*   **Settings Persistence:** Frontend settings are saved locally via local storage.

## Frontend To-Do / Future Implementation

*   **Engine & Loadout Management:** Fully integrate the frontend UI for creating, editing, deleting, and selecting engine loadouts with the backend API.
*   **Personal Sources Integration:** Connect the UI for managing personal sources (Obsidian, Local Files, AI, YouTube, SoundCloud, etc.) to the respective backend functionalities.
*   **Custom Knowledge Base Integration:** UI and logic for connecting and managing custom knowledge bases.
*   **Custom URL "Packs":** Functionality to define, import, and search within curated lists or "packs" of URLs.
*   **RAG-Infused Search:** Implement fully customizable searches enhanced by Retrieval-Augmented Generation. This includes:
    *   Searching across local files and connected knowledge bases.
    *   Leveraging embeddings from personal sources for truly personalized results.
*   **"Wave Racer" Search Mode:** Develop a novel search experience using LLMs to synthesize information from web results, personal sources, and knowledge bases into a gamified, exploratory "long-approach" to web surfing.
*   **Feature Integration:** Wire up remaining settings UI components to their corresponding backend features (e.g., RAG toggles, Result Proxy configuration, Rate Limiting display/controls if applicable).
*   **Authentication/Authorization UI:** Implement frontend login/logout flows if backend authentication is available.
*   **Error Handling & Loading States:** Enhance user feedback during API calls and background processes.
*   **Frontend Testing:** Increase frontend test coverage (unit, integration, e2e).
*   **UI/UX Refinements:** Continuously improve the user interface and experience based on available backend features.

## Getting Started (Development)

**Prerequisite:** Ensure the SlySearch backend service is running and accessible.

1.  Clone the repository.
2.  Install dependencies: `pnpm install`
3.  *(Optional)* Create a `.env.local` file if you need to override the default backend URL (defined in settings).
4.  Run the development server: `pnpm dev`
5.  Open [http://localhost:3000](http://localhost:3000) in your browser. 