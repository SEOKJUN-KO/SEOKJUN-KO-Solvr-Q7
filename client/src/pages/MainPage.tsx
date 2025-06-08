import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type ChartMeta = {
  id: string
  title: string
}

export default function MainPage() {
  const [charts, setCharts] = useState<ChartMeta[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboard/charts')
      .then(res => res.json())
      .then(data => setCharts(data.data))
  }, [])

  return (
    <div>
      <h1>대시보드 차트 목록</h1>
      <ul>
        {charts.map(chart => (
          <li key={chart.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/charts/${chart.id}`)}>
            {chart.title}
          </li>
        ))}
      </ul>
    </div>
  )
} 