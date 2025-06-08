import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardService } from '../services/api'
import { useLoading } from '../contexts/LoadingContext'
import type { ChartData } from '../../../shared/types/dashboard'

const chartTypeStyle = {
  bar: 'from-blue-400 to-cyan-400',
  line: 'from-pink-400 to-fuchsia-400',
  pie: 'from-yellow-400 to-orange-400',
  default: 'from-gray-300 to-gray-400'
}

const chartTypeIcon = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  default: '📦'
}

export default function MainPage() {
  const [charts, setCharts] = useState<ChartData[]>([])
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { startLoading, stopLoading } = useLoading()

  const fetchCharts = useCallback(async () => {
    try {
      startLoading()
      const data = await dashboardService.getCharts()
      setCharts(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '차트 데이터를 불러오는데 실패했습니다.')
    } finally {
      stopLoading()
    }
  }, [startLoading, stopLoading])

  useEffect(() => {
    fetchCharts()
  }, [fetchCharts])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500 text-center drop-shadow mb-2 animate-fade-in">
          대시보드 차트
        </h1>
        <p className="text-xl text-gray-500 text-center mb-12">패키지 릴리즈 통계를 다양한 차트로 확인해보세요</p>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {charts.map(chart => (
            <div
              key={chart.id}
              onClick={() => navigate(`/charts/${chart.id}`)}
              className={`group cursor-pointer rounded-2xl shadow-xl bg-white hover:scale-105 transition-transform duration-300 border-2 border-transparent hover:border-indigo-400`}
            >
              <div className={`h-32 flex items-center justify-center rounded-t-2xl bg-gradient-to-r ${(chartTypeStyle as any)[chart.type] || chartTypeStyle.default}`}>
                <span className="text-5xl drop-shadow">{(chartTypeIcon as any)[chart.type] || chartTypeIcon.default}</span>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition">{chart.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{chart.type === 'bar' ? '막대 차트' : chart.type === 'line' ? '선 차트' : chart.type === 'pie' ? '파이 차트' : ''}</p>
                <span className="inline-block text-indigo-500 font-semibold group-hover:underline">차트 보기 →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
