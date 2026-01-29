import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { HelmetProvider } from 'react-helmet-async'
import { GlobalStyles } from '@/styles/GlobalStyles'
import { theme } from '@/styles/theme'
import { Home } from '@/pages/Home'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { initGA, trackPageView } from '@/utils/analytics'

// Initialize Google Analytics once when the app loads
initGA()

// Component to track page views on route changes
function RouteTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <LanguageSwitcher />
        <BrowserRouter basename="/dna-merge">
          <RouteTracker />
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  )
}

export default App
