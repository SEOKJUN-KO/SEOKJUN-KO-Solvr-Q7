import { FastifyInstance } from 'fastify'
import { AppContext } from '../types/context'

export function createDashboardRoutes(context: AppContext) {
  return async (fastify: FastifyInstance) => {
    // 모든 차트 데이터 조회
    fastify.get('/charts', async (request, reply) => {
      try {
        const charts = await context.dashboardService.getCharts()
        return reply.send({
          success: true,
          data: charts
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          success: false,
          error: '차트 데이터를 가져오는 중 오류가 발생했습니다.'
        })
      }
    })

    // 특정 차트 데이터 조회
    fastify.get('/charts/:id', async (request, reply) => {
      try {
        const { id } = request.params as { id: string }
        const chart = await context.dashboardService.getChartById(id)
        
        if (!chart) {
          return reply.status(404).send({
            success: false,
            error: '해당 차트를 찾을 수 없습니다.'
          })
        }

        return reply.send({
          success: true,
          data: chart
        })
      } catch (error) {
        fastify.log.error(error)
        return reply.status(500).send({
          success: false,
          error: '차트 데이터를 가져오는 중 오류가 발생했습니다.'
        })
      }
    })
  }
} 