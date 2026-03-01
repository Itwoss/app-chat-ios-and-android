# Frontend - Chat App

React + Vite frontend application for the Chat App.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5001
VITE_FRONTEND_URL=http://localhost:5173
```

3. Start the development server:
```bash
npm run dev
```

## Features

- React 18 with Vite
- Chakra UI for components
- Redux Toolkit (RTK Query) for state management
- Dark/Light theme support
- Error boundary for authentication errors
- Cookie and localStorage management

## Project Structure

```
frontend/
├── src/
│   ├── components/  # Reusable components
│   ├── pages/       # Page components
│   ├── store/       # Redux store, slices, and APIs
│   ├── theme/       # Chakra UI theme
│   ├── utils/       # Utility functions
│   └── App.jsx      # Main app component
└── package.json
```

## Pages

- Home (`/`)
- About Us (`/about`)
- Services (`/services`)
- Contact Us (`/contact`)
- Login (`/login`)
- Register (`/register`)

