import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ChartView from '../components/ChartView'

type ChartData = {
  id: string
  title: string
  description: string
  type: 'bar' | 'line' | 'pie'
  data: any
}

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [chart, setChart] = useState<ChartData | null>(null)

  useEffect(() => {
    fetch(`/api/dashboard/charts/${id}`)
      .then(res => res.json())
      .then(data => setChart(data.data))
  }, [id])

  if (!chart) return <div>로딩 중...</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold">{chart.title}</h2>
      <div className="card p-4">
        <ChartView chart={chart} />
      </div>
      <p className="text-neutral-700">{chart.description}</p>
    </div>
  )
}
