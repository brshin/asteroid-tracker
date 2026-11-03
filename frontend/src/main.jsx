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
    colorPrimary: '#e4572e',
    colorPrimaryForeground: '#fff8f5',
    colorBackground: '#f7fafc',
    colorForeground: '#101820',
    colorMuted: '#edf2f7',
    colorMutedForeground: '#3a4654',
    colorNeutral: '#101820',
    colorInput: '#ffffff',
    colorInputForeground: '#101820',
    colorBorder: '#c5d0dc',
    colorRing: '#e4572e',
    colorModalBackdrop: '#101820',
    colorDanger: '#b42318',
    colorSuccess: '#0f7a6c',
    colorWarning: '#e4572e',
    fontFamily: 'Sora, ui-sans-serif, system-ui, sans-serif',
    borderRadius: '0.25rem',
  },
  elements: {
    card: {
      backgroundColor: '#f7fafc',
      border: '1px solid #c5d0dc',
      boxShadow: '0 18px 40px rgba(16, 24, 32, 0.12)',
    },
    headerTitle: {
      fontFamily: 'Syne, ui-sans-serif, system-ui, sans-serif',
      color: '#101820',
    },
    modalBackdrop: {
      backgroundColor: 'rgba(16, 24, 32, 0.55)',
    },
    formButtonPrimary: {
      backgroundColor: '#e4572e',
      color: '#fff8f5',
      fontWeight: 600,
    },
    userButtonPopoverCard: {
      backgroundColor: '#f7fafc',
      border: '1px solid #c5d0dc',
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
