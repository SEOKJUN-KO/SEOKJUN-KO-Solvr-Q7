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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="text-neutral-600">
        Github 릴리즈 데이터를 분석하여 팀의 개발 활동을 모니터링하는 도구예요 📊 단순히 데이터를
        모으는 것을 넘어서, 의미있는 통계 정보를 도출하는 게 목표입니다.
      </p>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {charts.map(chart => (
          <div
            key={chart.id}
            className="card cursor-pointer hover:shadow-lg"
            onClick={() => navigate(`/charts/${chart.id}`)}
          >
            <h2 className="font-semibold">{chart.title}</h2>
          </div>
        ))}
      </div>
    </div>
  )
}
