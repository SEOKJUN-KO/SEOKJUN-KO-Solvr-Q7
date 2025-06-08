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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">대시보드 차트 목록</h1>
      <ul className="grid gap-4 md:grid-cols-2">
        {charts.map(chart => (
          <li
            key={chart.id}
            className="card cursor-pointer hover:bg-primary-50"
            onClick={() => navigate(`/charts/${chart.id}`)}
          >
            <h2 className="font-semibold">{chart.title}</h2>
          </li>
        ))}
      </ul>
    </div>
  )
}
