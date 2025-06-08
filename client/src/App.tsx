import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import ChartDetailPage from './pages/ChartDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/charts/:id" element={<ChartDetailPage />} />
    </Routes>
  )
}

export default App
