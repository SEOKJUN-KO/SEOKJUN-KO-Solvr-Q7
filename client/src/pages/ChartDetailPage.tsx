import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ChartView from '../components/ChartView'
import { dashboardService } from '../services/api'
import { useLoading } from '../contexts/LoadingContext'
import type { ChartData } from '../../../shared/types/dashboard'

const chartTypeIcon = {
  bar: '📊',
  line: '📈',
  pie: '🥧',
  default: '📦'
}

export default function ChartDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [chart, setChart] = useState<ChartData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { startLoading, stopLoading } = useLoading()

  const fetchChart = useCallback(async () => {
    if (!id) return
    
    try {
      startLoading()
      const data = await dashboardService.getChartById(id)
      setChart(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '차트 데이터를 불러오는데 실패했습니다.')
    } finally {
      stopLoading()
    }
  }, [id, startLoading, stopLoading])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          <p>{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  if (!chart) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="text-2xl text-gray-500 animate-pulse">로딩 중...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="rounded-full bg-white shadow-lg px-4 py-2 text-indigo-600 font-bold hover:bg-indigo-50 transition"
          >
            ←
          </button>
          <span className="text-4xl">{(chartTypeIcon as any)[chart.type] || chartTypeIcon.default}</span>
          <h2 className="text-3xl font-extrabold text-gray-900 drop-shadow">{chart.title}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="bg-white/80 rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-2 text-indigo-600">차트 설명</h3>
            <p className="text-gray-700">{chart.description || '설명이 없습니다.'}</p>
          </div>
          <div className="bg-white/80 rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-2 text-pink-600">데이터 인사이트</h3>
            <p className="text-gray-700">{chart.insight || '인사이트가 없습니다.'}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <ChartView chart={chart} />
        </div>
      </div>
    </div>
  )
}
