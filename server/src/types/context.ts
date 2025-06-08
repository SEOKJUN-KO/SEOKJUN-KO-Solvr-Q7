import { UserService } from 'services/userService'
import { DashboardService } from 'services/dashboardService'

export type AppContext = {
  userService: UserService
  dashboardService: DashboardService
}
