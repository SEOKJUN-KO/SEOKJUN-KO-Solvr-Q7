import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { FC } from 'react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
)

type ChartData = {
  id: string
  title: string
  description: string
  type: 'bar' | 'line' | 'pie'
  data: any
}

const ChartView: FC<{ chart: ChartData }> = ({ chart }) => {
  if (chart.type === 'bar') return <Bar data={chart.data} />
  if (chart.type === 'line') return <Line data={chart.data} />
  if (chart.type === 'pie') return <Pie data={chart.data} />
  return null
}

export default ChartView
