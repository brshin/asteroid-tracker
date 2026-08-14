import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#c4a574',
    colorPrimaryForeground: '#07070c',
    colorBackground: '#101018',
    colorForeground: '#e8e6e3',
    colorMuted: '#1c1c24',
    colorMutedForeground: '#8b8b96',
    colorNeutral: '#e8e6e3',
    colorInput: '#07070c',
    colorInputForeground: '#e8e6e3',
    colorBorder: '#1c1c24',
    colorRing: '#c4a574',
    colorModalBackdrop: '#07070c',
    colorDanger: '#c17a6a',
    colorSuccess: '#8a9a7b',
    colorWarning: '#c9a227',
    fontFamily: 'IBM Plex Sans, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0.5rem',
  },
  elements: {
    card: {
      backgroundColor: '#101018',
      border: '1px solid #1c1c24',
      boxShadow: '0 24px 64px rgba(0, 0, 0, 0.55)',
    },
    headerTitle: {
      fontFamily: 'Instrument Serif, ui-serif, Georgia, serif',
      color: '#e8e6e3',
    },
    modalBackdrop: {
      backgroundColor: 'rgba(7, 7, 12, 0.78)',
    },
    formButtonPrimary: {
      backgroundColor: '#c4a574',
      color: '#07070c',
      fontWeight: 600,
    },
    userButtonPopoverCard: {
      backgroundColor: '#101018',
      border: '1px solid #1c1c24',
    },
  },
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} appearance={clerkAppearance}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
