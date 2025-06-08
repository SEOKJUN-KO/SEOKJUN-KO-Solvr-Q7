import { readCSV, CSVData } from '../utils/csvReader'

type ChartDataset = {
  label: string
  data: number[]
}

type ChartData = {
  id: string
  title: string
  description: string
  type: 'bar' | 'line' | 'pie'
  data: {
    labels: string[]
    datasets: ChartDataset[]
  }
}

export type DashboardService = {
  getCharts: () => Promise<ChartData[]>
  getChartById: (id: string) => Promise<ChartData | null>
}

export function createDashboardService(): DashboardService {
  let packageStats: CSVData | null = null
  let releaseStats: CSVData | null = null
  let rawReleases: CSVData | null = null

  const loadData = () => {
    if (!packageStats) {
      packageStats = readCSV('data/package-stats.csv')
    }
    if (!releaseStats) {
      releaseStats = readCSV('data/release-stats.csv')
    }
    if (!rawReleases) {
      rawReleases = readCSV('data/raw-releases.csv')
    }
    return { packageStats, releaseStats, rawReleases }
  }

  const createPackageReleaseChart = (): ChartData => {
    const { packageStats } = loadData()
    const data = packageStats
      .sort((a, b) => Number(b['총 릴리즈 수']) - Number(a['총 릴리즈 수']))
      .slice(0, 10)
      .map(pkg => ({
        name: pkg['패키지명'],
        value: Number(pkg['총 릴리즈 수'])
      }))

    const top = data[0]

    return {
      id: 'package-releases',
      title: '패키지별 릴리즈 수',
      description: `가장 많이 릴리즈된 패키지는 ${top.name}로 총 ${top.value}회 릴리즈되었습니다.`,
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [
          {
            label: '릴리즈 수',
            data: data.map(d => d.value)
          }
        ]
      }
    }
  }

  const createReleaseCycleChart = (): ChartData => {
    const { packageStats } = loadData()
    const data = packageStats
      .filter(pkg => Number(pkg['평균 릴리즈 주기(근무일 기준)']) > 0)
      .map(pkg => ({
        name: pkg['패키지명'],
        value: Number(pkg['평균 릴리즈 주기(근무일 기준)'])
      }))

    const max = data.reduce((a, b) => (a.value > b.value ? a : b))

    return {
      id: 'release-cycle',
      title: '릴리즈 주기 분포',
      description: `${max.name} 패키지의 릴리즈 주기가 가장 길며 평균 ${max.value} 근무일입니다.`,
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [
          {
            label: '평균 릴리즈 주기 (근무일)',
            data: data.map(d => d.value)
          }
        ]
      }
    }
  }

  const createReleaseTypeChart = (): ChartData => {
    const { releaseStats } = loadData()
    const data = releaseStats.map(repo => ({
      name: repo['저장소'],
      prerelease: Number(repo['프리릴리즈 비율(%)']),
      weekend: Number(repo['주말 릴리즈 비율(%)'])
    }))

    const prereleaseAvg = data.reduce((sum, repo) => sum + repo.prerelease, 0) / data.length
    const weekendAvg = data.reduce((sum, repo) => sum + repo.weekend, 0) / data.length

    return {
      id: 'release-types',
      title: '릴리즈 유형 분포',
      description: `평균 프리릴리즈 비율은 ${prereleaseAvg.toFixed(1)}%, 주말 릴리즈 비율은 ${weekendAvg.toFixed(1)}%입니다.`,
      type: 'pie',
      data: {
        labels: ['프리릴리즈', '주말 릴리즈', '일반 릴리즈'],
        datasets: [
          {
            label: '비율 (%)',
            data: [
              data.reduce((sum, repo) => sum + repo.prerelease, 0) / data.length,
              data.reduce((sum, repo) => sum + repo.weekend, 0) / data.length,
              100 -
                data.reduce((sum, repo) => sum + repo.prerelease + repo.weekend, 0) / data.length
            ]
          }
        ]
      }
    }
  }

  return {
    async getCharts() {
      return [createPackageReleaseChart(), createReleaseCycleChart(), createReleaseTypeChart()]
    },
    async getChartById(id: string) {
      const charts = await this.getCharts()
      return charts.find(chart => chart.id === id) || null
    }
  }
}
