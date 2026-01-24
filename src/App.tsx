import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { GlobalStyles } from '@/styles/GlobalStyles'
import { theme } from '@/styles/theme'
import { Home } from '@/pages/Home'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <LanguageSwitcher />
      <BrowserRouter basename="/dna-merge">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
