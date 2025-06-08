import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import ChartDetailPage from './pages/ChartDetailPage'
import { LoadingProvider } from './contexts/LoadingContext'

function App() {
  return (
    <LoadingProvider>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/charts/:id" element={<ChartDetailPage />} />
      </Routes>
    </LoadingProvider>
  )
}

export default App
