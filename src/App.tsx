import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Catalog } from './pages/Catalog'
import { Home } from './pages/Home'
import { Ruler } from './pages/Ruler'
import { Stats } from './pages/Stats'
import { Timeline } from './pages/Timeline'
import { ThemeProvider } from './theme'

export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="catalog" element={<Catalog />} />
            <Route path="ruler/:id" element={<Ruler />} />
            <Route path="stats" element={<Stats />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
