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
  type: 'bar' | 'line' | 'pie'
  data: any
}

const ChartView: FC<{ chart: ChartData }> = ({ chart }) => {
  const options = { maintainAspectRatio: false }
  if (chart.type === 'bar')
    return (
      <div className="h-96">
        <Bar data={chart.data} options={options} />
      </div>
    )
  if (chart.type === 'line')
    return (
      <div className="h-96">
        <Line data={chart.data} options={options} />
      </div>
    )
  if (chart.type === 'pie')
    return (
      <div className="h-96">
        <Pie data={chart.data} options={options} />
      </div>
    )
  return null
}

export default ChartView
