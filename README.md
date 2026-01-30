# SyncVision

Real-time meeting visualization tool to align mental models among participants.

## Features

- **Matrix View**: 4-quadrant visualization (Importance × Urgency)
- **Kanban View**: Process flow (Backlog → Todo → Doing → Done)
- **List View**: Table format for detailed management
- **Multi-page**: Separate workspaces per agenda item
- **Drag & Drop**: Intuitive item organization
- **Progress Bar**: Visual agenda tracking

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [lucide-react](https://lucide.dev/) - Icons

## Project Structure

```
├── app/                 # Next.js App Router
├── components/ui/       # Reusable UI components
├── features/sync-vision # Main feature module
├── lib/                 # Utilities
└── types/               # TypeScript definitions
```

## License

MIT
