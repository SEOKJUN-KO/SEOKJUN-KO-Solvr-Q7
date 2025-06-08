import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ChartView from '../components/ChartView'

type ChartData = {
  id: string
  title: string
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

  const descriptions: Record<string, string> = {
    'package-releases':
      '패키지별 릴리즈 수를 통해 어떤 패키지가 활발히 관리되고 있는지 확인할 수 있어요.',
    'release-cycle': '평균 릴리즈 주기가 짧을수록 더 자주 배포하고 있다는 의미예요.',
    'release-types': '프리릴리즈나 주말 릴리즈 비율을 통해 릴리즈 성격을 살펴볼 수 있어요.',
    'monthly-releases': '월별 전체 릴리즈 수 추이를 보면 개발 활동량의 변화를 파악할 수 있어요.',
    'top-authors': '릴리즈를 가장 많이 발행한 기여자를 확인할 수 있어요.'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{chart.title}</h2>
      <p className="text-neutral-600">{descriptions[chart.id]}</p>
      <div className="card">
        <ChartView chart={chart} />
      </div>
    </div>
  )
}
