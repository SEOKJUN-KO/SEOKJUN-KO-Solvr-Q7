export type ChartDataset = {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  tension?: number
}

export type ChartData = {
  id: string
  title: string
  type: 'bar' | 'line' | 'pie'
  description: string
  insight: string
  data: {
    labels: string[]
    datasets: ChartDataset[]
  }
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
} 