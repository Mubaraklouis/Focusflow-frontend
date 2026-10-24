<template>
  <NuxtLayout name="app-layout" :breadcrumbs="breadcrumbs">
    <div v-if="profile?.role !== 'admin'" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center space-y-4">
        <ShieldAlert class="w-16 h-16 mx-auto text-destructive" />
        <h1 class="text-2xl font-bold text-foreground">Access Denied</h1>
        <p class="text-muted-foreground">You do not have permission to view this page.</p>
        <Button @click="navigateTo('/')" variant="default">Return to Dashboard</Button>
      </div>
    </div>

    <div v-else class="space-y-8 p-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
          <p class="text-muted-foreground mt-1">Monitor user activity, growth, and role distribution.</p>
        </div>
        <div class="flex items-center gap-3">
          <Button @click="navigateTo('/admin/users')" variant="outline" class="gap-2">
            <Users class="w-4 h-4" />
            Manage Users
          </Button>
          <Button @click="navigateTo('/admin/ai')" variant="outline" class="gap-2">
            <Cpu class="w-4 h-4" />
            AI usage
          </Button>
          <Button @click="refreshData" :disabled="isLoading" variant="default" class="gap-2">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
            Refresh
          </Button>
        </div>
      </div>

      <div v-if="error" class="bg-destructive/10 text-destructive p-4 rounded-md border border-destructive/20 flex items-center gap-3">
        <AlertCircle class="w-5 h-5" />
        <p>{{ error }}</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">Total Users</h3>
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-foreground">{{ stats?.totalUsers || 0 }}</p>
            <p class="text-xs text-muted-foreground mt-1">Across all platforms</p>
          </div>
        </div>

        <div class="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">Active Users (30d)</h3>
            <div class="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Activity class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-foreground">{{ stats?.activeUsers || 0 }}</p>
            <p class="text-xs text-muted-foreground mt-1">Logged in last 30 days</p>
          </div>
        </div>

        <div class="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">New This Month</h3>
            <div class="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <UserPlus class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-foreground">{{ stats?.newUsers || 0 }}</p>
            <p class="text-xs text-muted-foreground mt-1">Registrations this month</p>
          </div>
        </div>

        <div class="bg-card text-card-foreground rounded-xl border border-border p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-muted-foreground">Growth Rate</h3>
            <div class="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
              <TrendingUp class="w-5 h-5" />
            </div>
          </div>
          <div class="mt-4">
            <p class="text-3xl font-bold text-foreground">{{ stats?.growthPercent || 0 }}%</p>
            <p class="text-xs text-muted-foreground mt-1">Month over month</p>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Role Distribution -->
        <div class="lg:col-span-1 space-y-4">
          <h2 class="text-xl font-semibold text-foreground">Role Distribution</h2>
          <div class="space-y-4">
            <div class="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2 text-foreground font-medium">
                  <GraduationCap class="w-4 h-4 text-primary" />
                  Students
                </div>
                <span class="font-bold">{{ getRoleCount('student') }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="bg-primary h-2 rounded-full" :style="{ width: getRolePercentage('student') + '%' }"></div>
              </div>
              <p class="text-xs text-muted-foreground mt-2 text-right">{{ getRolePercentage('student') }}% of users</p>
            </div>

            <div class="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2 text-foreground font-medium">
                  <BookOpen class="w-4 h-4 text-emerald-500" />
                  Teachers
                </div>
                <span class="font-bold">{{ getRoleCount('teacher') }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="bg-emerald-500 h-2 rounded-full" :style="{ width: getRolePercentage('teacher') + '%' }"></div>
              </div>
              <p class="text-xs text-muted-foreground mt-2 text-right">{{ getRolePercentage('teacher') }}% of users</p>
            </div>

            <div class="bg-card border border-border rounded-xl p-5 shadow-sm">
              <div class="flex justify-between items-center mb-2">
                <div class="flex items-center gap-2 text-foreground font-medium">
                  <ShieldCheck class="w-4 h-4 text-orange-500" />
                  Admins
                </div>
                <span class="font-bold">{{ getRoleCount('admin') }}</span>
              </div>
              <div class="w-full bg-muted rounded-full h-2">
                <div class="bg-orange-500 h-2 rounded-full" :style="{ width: getRolePercentage('admin') + '%' }"></div>
              </div>
              <p class="text-xs text-muted-foreground mt-2 text-right">{{ getRolePercentage('admin') }}% of users</p>
            </div>
          </div>
        </div>

        <!-- User Growth Table/Chart Placeholder -->
        <div class="lg:col-span-2">
          <div class="bg-card border border-border rounded-xl shadow-sm h-full flex flex-col">
            <div class="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 class="text-xl font-semibold text-foreground">User Growth History</h2>
                <p class="text-sm text-muted-foreground">Historical user registration data</p>
              </div>
              <select class="bg-background border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary px-3 py-1.5 outline-none">
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div class="p-0 overflow-x-auto flex-1">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th scope="col" class="px-6 py-4 font-medium">Period</th>
                    <th scope="col" class="px-6 py-4 font-medium text-right">New Users</th>
                    <th scope="col" class="px-6 py-4 font-medium text-right">Cumulative Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-if="!userGrowth || userGrowth.length === 0" class="hover:bg-muted/30">
                    <td colspan="3" class="px-6 py-8 text-center text-muted-foreground">
                      No growth data available
                    </td>
                  </tr>
                  <tr v-for="(record, index) in userGrowth" :key="index" class="hover:bg-muted/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-foreground">{{ record.period }}</td>
                    <td class="px-6 py-4 text-right text-muted-foreground">+{{ record.count }}</td>
                    <td class="px-6 py-4 text-right font-semibold text-foreground">{{ record.cumulative }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useProfile } from '~/composables/Profile'
import { useAdminApi } from '~/composables/admin/useAdminApi'
import { Button } from '@/components/ui/button'
import { 
  Users, Activity, UserPlus, TrendingUp, 
  ShieldAlert, RefreshCw, AlertCircle, 
  GraduationCap, BookOpen, ShieldCheck, Cpu 
} from 'lucide-vue-next'

definePageMeta({ 
  layout: false, 
  middleware: ['auth'] 
})

const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Admin', to: '/admin' },
  { label: 'Overview' }
]

const { profile } = useProfile()
const { stats, userGrowth, roleDistribution, isLoading, error, fetchStats, fetchUserGrowth, fetchRoleDistribution } = useAdminApi()

const refreshData = async () => {
  if (profile.value?.role !== 'admin') return
  
  await Promise.all([
    fetchStats(),
    fetchUserGrowth('6m'),
    fetchRoleDistribution()
  ])
}

const getRoleCount = (role: string) => {
  if (!roleDistribution.value || !Array.isArray(roleDistribution.value)) return 0
  const item = roleDistribution.value.find((r: any) => r.role === role)
  return item ? item.count : 0
}

const getRolePercentage = (role: string) => {
  if (!roleDistribution.value || !Array.isArray(roleDistribution.value)) return 0
  const total = roleDistribution.value.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
  if (total === 0) return 0
  
  const count = getRoleCount(role)
  return Math.round((count / total) * 100)
}

onMounted(() => {
  refreshData()
})
</script>
