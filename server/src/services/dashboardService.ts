import { readCSV, CSVData } from '../utils/csvReader'

type ChartDataset = {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  tension?: number
}

type ChartData = {
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

    return {
      id: 'package-releases',
      title: '패키지별 릴리즈 수',
      type: 'bar',
      description: '각 패키지별로 총 몇 번의 릴리즈가 있었는지 보여줍니다. 활발하게 관리되는 패키지를 한눈에 파악할 수 있습니다.',
      insight: '릴리즈 수가 많은 패키지는 활발하게 개발 및 유지보수가 이루어지고 있음을 의미합니다. 반대로 릴리즈 수가 적은 패키지는 상대적으로 관리 빈도가 낮을 수 있습니다.',
      data: {
        labels: data.map(d => d.name),
        datasets: [
          {
            label: '릴리즈 수',
            data: data.map(d => d.value),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
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

    return {
      id: 'release-cycle',
      title: '릴리즈 주기 분포',
      type: 'bar',
      description: '각 패키지의 평균 릴리즈 주기(근무일 기준)를 보여줍니다. 주기가 짧을수록 더 자주 릴리즈가 이루어집니다.',
      insight: '평균 릴리즈 주기가 짧은 패키지는 빠른 피드백과 개선이 이루어지고 있음을 의미합니다. 주기가 긴 패키지는 안정성을 중시하거나, 개발 리소스가 적을 수 있습니다.',
      data: {
        labels: data.map(d => d.name),
        datasets: [
          {
            label: '평균 릴리즈 주기 (근무일)',
            data: data.map(d => d.value),
            backgroundColor: 'rgba(16, 185, 129, 0.5)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1
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

    return {
      id: 'release-types',
      title: '릴리즈 유형 분포',
      type: 'pie',
      description: '프리릴리즈, 주말 릴리즈, 일반 릴리즈의 비율을 파이 차트로 보여줍니다. 릴리즈의 성격과 팀의 배포 패턴을 파악할 수 있습니다.',
      insight: '프리릴리즈 비율이 높으면 실험적 기능이나 베타 배포가 많음을 의미합니다. 주말 릴리즈 비율이 높으면 개발팀의 유연한 근무 문화를 엿볼 수 있습니다.',
      data: {
        labels: ['프리릴리즈', '주말 릴리즈', '일반 릴리즈'],
        datasets: [
          {
            label: '비율 (%)',
            data: [
              data.reduce((sum, repo) => sum + repo.prerelease, 0) / data.length,
              data.reduce((sum, repo) => sum + repo.weekend, 0) / data.length,
              100 - (data.reduce((sum, repo) => sum + repo.prerelease + repo.weekend, 0) / data.length)
            ],
            backgroundColor: [
              'rgba(239, 68, 68, 0.5)',  // 빨강
              'rgba(245, 158, 11, 0.5)', // 주황
              'rgba(59, 130, 246, 0.5)'  // 파랑
            ],
            borderColor: [
              'rgb(239, 68, 68)',
              'rgb(245, 158, 11)',
              'rgb(59, 130, 246)'
            ],
            borderWidth: 1
          }
        ]
      }
    }
  }

  const createMonthlyTrendChart = (): ChartData => {
    const { rawReleases } = loadData()
    const counts: Record<string, number> = {}
    rawReleases.forEach(rel => {
      const date = new Date(rel['발행일시'])
      if (!isNaN(date.getTime())) {
        const month = date.toISOString().slice(0, 7)
        counts[month] = (counts[month] || 0) + 1
      }
    })
    const months = Object.keys(counts).sort()
    return {
      id: 'monthly-releases',
      title: '월별 릴리즈 추세',
      type: 'line',
      description: '월별 전체 릴리즈 수의 변화를 선 그래프로 보여줍니다. 개발 활동의 흐름과 시즌별 변동을 파악할 수 있습니다.',
      insight: '특정 시기에 릴리즈가 급증하거나 감소하는 패턴을 통해 프로젝트의 주요 이벤트(예: 대규모 기능 추가, 리팩토링, 휴가 시즌 등)를 추정할 수 있습니다.',
      data: {
        labels: months,
        datasets: [
          {
            label: '릴리즈 수',
            data: months.map(m => counts[m]),
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            borderColor: 'rgb(139, 92, 246)',
            borderWidth: 2,
            tension: 0.4
          }
        ]
      }
    }
  }

  const createTopAuthorsChart = (): ChartData => {
    const { rawReleases } = loadData()
    const counts: Record<string, number> = {}
    rawReleases.forEach(rel => {
      const author = rel['작성자 이름']
      counts[author] = (counts[author] || 0) + 1
    })
    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
    return {
      id: 'top-authors',
      title: '릴리즈 작성자 TOP 10',
      type: 'bar',
      description: '릴리즈를 가장 많이 발행한 상위 10명의 기여자를 보여줍니다. 팀 내 주요 기여자를 파악할 수 있습니다.',
      insight: '특정 기여자가 릴리즈를 독점하고 있다면, 지식 분산이나 코드 리뷰 프로세스 개선이 필요할 수 있습니다. 다양한 기여자가 릴리즈를 발행한다면 건강한 협업 문화를 기대할 수 있습니다.',
      data: {
        labels: top.map(t => t[0]),
        datasets: [
          {
            label: '릴리즈 수',
            data: top.map(t => t[1]),
            backgroundColor: 'rgba(236, 72, 153, 0.5)',
            borderColor: 'rgb(236, 72, 153)',
            borderWidth: 1
          }
        ]
      }
    }
  }

  return {
    async getCharts() {
      return [
        createPackageReleaseChart(),
        createReleaseCycleChart(),
        createReleaseTypeChart(),
        createMonthlyTrendChart(),
        createTopAuthorsChart()
      ]
    },
    async getChartById(id: string) {
      const charts = await this.getCharts()
      return charts.find(chart => chart.id === id) || null
    }
  }
}
