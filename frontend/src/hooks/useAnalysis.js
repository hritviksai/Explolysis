import { useQuery } from '@tanstack/react-query'
import {
  fetchOverview, fetchDistribution, fetchCorrelation,
  fetchOutliers, fetchQuality
} from '../utils/api'

export function useOverview(sessionId) {
  return useQuery({
    queryKey: ['overview', sessionId],
    queryFn: () => fetchOverview(sessionId),
    enabled: !!sessionId,
    staleTime: Infinity,
  })
}

export function useDistribution(sessionId, column) {
  return useQuery({
    queryKey: ['distribution', sessionId, column],
    queryFn: () => fetchDistribution(sessionId, column),
    enabled: !!sessionId && !!column,
    staleTime: Infinity,
  })
}

export function useCorrelation(sessionId, method) {
  return useQuery({
    queryKey: ['correlation', sessionId, method],
    queryFn: () => fetchCorrelation(sessionId, method),
    enabled: !!sessionId,
    staleTime: Infinity,
  })
}

export function useOutliers(sessionId, method) {
  return useQuery({
    queryKey: ['outliers', sessionId, method],
    queryFn: () => fetchOutliers(sessionId, method),
    enabled: !!sessionId,
    staleTime: Infinity,
  })
}

export function useQuality(sessionId) {
  return useQuery({
    queryKey: ['quality', sessionId],
    queryFn: () => fetchQuality(sessionId),
    enabled: !!sessionId,
    staleTime: Infinity,
  })
}
