# SlySearch Frontend

**⚠️ WARNING: This project is currently under active development and is incomplete. Features may be broken or missing. Pull and use at your own risk. ⚠️**

This repository contains the frontend application for SlySearch, a customizable search engine interface.

## Technology Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (built on Radix UI Primitives & Lucide Icons)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand) (with localStorage persistence for settings)
*   **Schema Validation:** [Zod](https://zod.dev/)
*   **Package Manager:** [pnpm](https://pnpm.io/)

## Current State

*   **Homepage:** Basic search interface with input, logo, and selectors.
*   **Search Results Page:** Displays search results fetched from the backend API. Supports different layouts (list, grid, compact).
*   **Settings Page:** UI for configuring various application settings, categorized into sections:
    *   General (Instance Name, Results per Page, Safe Search, etc.)
    *   Engines (Engine list management - UI only)
    *   Privacy (Proxy settings, Tracker removal, etc. - UI only)
    *   Appearance (Theme, Layout, Alignment, etc.)
    *   Advanced (Backend URL, Timeouts, Debug Mode, etc.)
    *   Personal Sources (Management for different source types like Web, Obsidian, Local Files, AI - UI only)
*   **API Routes:** Basic Next.js API routes exist for `/api/search`, `/api/settings`, `/api/health`. (Backend logic likely needs implementation).
*   **Theme:** Supports dark/light themes via `next-themes`.
*   **Basic Settings Persistence:** Settings are saved to local storage.

## To-Do / Future Implementation

*   **Backend Integration:** Connect API routes (`/api/search`, `/api/settings`) to a functional backend service. The current API routes are likely placeholders.
*   **Engine & Loadout Logic:** Implement the backend logic for managing search engines and engine loadouts.
*   **Personal Sources Implementation:** Implement the fetching and searching logic for configured personal sources (Obsidian, Local Files, AI, YouTube, SoundCloud, etc.).
*   **Feature Completeness:** Fully implement features mentioned in the settings UI (e.g., RAG, Result Proxy, Rate Limiting, etc.).
*   **Authentication/Authorization:** No user authentication is currently implemented.
*   **Error Handling & Loading States:** Improve user feedback during loading and error scenarios.
*   **Testing:** Add comprehensive unit, integration, and end-to-end tests.
*   **Documentation:** Expand documentation for components, setup, and configuration.
*   **Deployment:** Define and document deployment processes.
*   **UI/UX Refinements:** Continuously improve the user interface and experience.

## Getting Started (Development)

1.  Clone the repository.
2.  Install dependencies: `pnpm install`
3.  Run the development server: `pnpm dev`
4.  Open [http://localhost:3000](http://localhost:3000) in your browser. 