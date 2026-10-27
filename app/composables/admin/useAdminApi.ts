import { ref } from 'vue'

export function useAdminApi() {
  const users = ref<any[]>([])
  const stats = ref<any>(null)
  const analyticsOverview = ref<any>(null)
  const userGrowth = ref<any[]>([])
  const roleDistribution = ref<any>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (params?: { search?: string, role?: string, per_page?: number }) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any>('/api/admin/users', {
        params
      })
      // Laravel paginate() wraps the array in a 'data' property
      users.value = response.data?.data || response.data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch users'
    } finally {
      isLoading.value = false
    }
  }

  const fetchStats = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any>('/api/admin/analytics/overview')
      if (response.data) {
        stats.value = {
          totalUsers: response.data.total_users || 0,
          activeUsers: response.data.active_users || 0,
          newUsers: response.data.new_users_this_month || 0,
          growthPercent: response.data.growth_percentage || 0
        }
      }
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch stats'
    } finally {
      isLoading.value = false
    }
  }

  /** Plan (F4.2): free or pro, set by admins until payments exist. */
  const updateUserPlan = (userId: number, plan: 'free' | 'pro') =>
    $fetch<any>(`/api/admin/users/${userId}/plan`, { method: 'PUT', body: { plan } })

  const updateUserRole = async (userId: number, role: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any>(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        body: { role }
      })
      return response
    } catch (e: any) {
      error.value = e.message || 'Failed to update user role'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  const fetchAnalyticsOverview = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any>('/api/admin/analytics/overview')
      analyticsOverview.value = response
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch analytics overview'
    } finally {
      isLoading.value = false
    }
  }

  const fetchUserGrowth = async (period?: string) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any>('/api/admin/analytics/users/growth', {
        params: { period }
      })
      userGrowth.value = response
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch user growth'
    } finally {
      isLoading.value = false
    }
  }

  const fetchRoleDistribution = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any>('/api/admin/analytics/users/roles')
      roleDistribution.value = response
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch role distribution'
    } finally {
      isLoading.value = false
    }
  }

  return {
    users,
    stats,
    analyticsOverview,
    userGrowth,
    roleDistribution,
    isLoading,
    error,
    fetchUsers,
    fetchStats,
    updateUserRole,
    updateUserPlan,
    fetchAnalyticsOverview,
    fetchUserGrowth,
    fetchRoleDistribution
  }
}
