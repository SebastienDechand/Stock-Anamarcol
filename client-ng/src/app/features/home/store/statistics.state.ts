import { DashboardStats } from '../../../shared/models/statistics.model';

export interface StatisticsState {
  dashboard: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
}

export const initialStatisticsState: StatisticsState = {
  dashboard: null,
  isLoading: false,
  error: null,
};
