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

    <div v-else class="space-y-6 p-6 max-w-7xl mx-auto">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
          <p class="text-muted-foreground mt-1">Manage user accounts and roles.</p>
        </div>
      </div>

      <!-- Toast Messages -->
      <div v-if="toastMessage" 
           :class="[
             'px-4 py-3 rounded-md border shadow-sm flex items-center justify-between transition-all duration-300',
             toastType === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
           ]">
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="toastType === 'success'" class="w-5 h-5" />
          <AlertCircle v-else class="w-5 h-5" />
          <p class="text-sm font-medium">{{ toastMessage }}</p>
        </div>
        <button @click="toastMessage = ''" class="text-current opacity-70 hover:opacity-100">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div class="relative w-full sm:max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            v-model="searchQuery" 
            placeholder="Search users by name or email..." 
            class="pl-9 w-full bg-background"
            @keyup.enter="applyFilters"
          />
        </div>
        <div class="flex items-center gap-3 w-full sm:w-auto">
          <select 
            v-model="roleFilter" 
            @change="applyFilters"
            class="bg-background border border-border text-foreground text-sm rounded-md focus:ring-primary focus:border-primary px-3 py-2 outline-none h-10 w-full sm:w-[150px]"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <Button @click="applyFilters" variant="default">
            Search
          </Button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th scope="col" class="px-6 py-4 font-medium">User</th>
                <th scope="col" class="px-6 py-4 font-medium">Email</th>
                <th scope="col" class="px-6 py-4 font-medium">Joined Date</th>
                <th scope="col" class="px-6 py-4 font-medium">Role</th>
                <th scope="col" class="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-if="isLoading && users.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-muted-foreground">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Loader2 class="w-6 h-6 animate-spin text-primary" />
                    <p>Loading users...</p>
                  </div>
                </td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-muted-foreground">
                  No users found matching your criteria.
                </td>
              </tr>
              <tr v-for="user in users" :key="user.id" class="hover:bg-muted/30 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                      <img v-if="user.avatar" :src="toProxiedAvatar(user.avatar)" alt="" class="w-full h-full object-cover" />
                      <span v-else>{{ user.name?.charAt(0).toUpperCase() || 'U' }}</span>
                    </div>
                    <div>
                      <p class="font-medium text-foreground">{{ user.name || 'Unknown User' }}</p>
                      <p class="text-xs text-muted-foreground">@{{ user.username || `user_${user.id}` }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 text-muted-foreground">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 text-muted-foreground">
                  {{ formatDate(user.joinedDate || user.created_at) }}
                </td>
                <td class="px-6 py-4">
                  <span :class="[
                    'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    user.role === 'admin' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                    user.role === 'teacher' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                    'bg-primary/10 text-primary border-primary/20'
                  ]">
                    {{ capitalize(user.role || 'student') }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <select 
                      :value="user.role || 'student'"
                      @change="(e) => handleRoleChange(user.id, (e.target as HTMLSelectElement).value)"
                      :disabled="isUpdatingRole === user.id"
                      class="bg-background border border-border text-foreground text-xs rounded-md focus:ring-primary focus:border-primary px-2 py-1.5 outline-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select
                      :value="(user as any).plan || 'free'"
                      aria-label="Plan"
                      class="bg-background border border-border text-foreground text-xs rounded-md focus:ring-primary focus:border-primary px-2 py-1.5 outline-none cursor-pointer"
                      @change="(e) => handlePlanChange(user.id, (e.target as HTMLSelectElement).value as 'free' | 'pro')"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                    <Loader2 v-if="isUpdatingRole === user.id" class="w-4 h-4 animate-spin text-primary" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="p-4 border-t border-border flex items-center justify-between bg-muted/20">
          <p class="text-sm text-muted-foreground">
            Showing <span class="font-medium text-foreground">{{ users.length }}</span> users
          </p>
          <div class="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              :disabled="currentPage <= 1 || isLoading"
              @click="changePage(currentPage - 1)"
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              :disabled="users.length < perPage || isLoading"
              @click="changePage(currentPage + 1)"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProfile } from '~/composables/Profile'
import { useAdminApi } from '~/composables/admin/useAdminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ShieldAlert, Search, Loader2, CheckCircle2, AlertCircle, X
} from 'lucide-vue-next'
import { toProxiedAvatar } from '~/utils/thumbUrl'

definePageMeta({ 
  layout: false, 
  middleware: ['auth'] 
})

const breadcrumbs = [
  { label: 'Home', to: '/' },
  { label: 'Admin', to: '/admin' },
  { label: 'Users' }
]

const { profile } = useProfile()
const { users, isLoading, error, fetchUsers, updateUserRole, updateUserPlan } = useAdminApi()
const handlePlanChange = async (userId: number, plan: 'free' | 'pro') => {
  try {
    await updateUserPlan(userId, plan)
    const user = users.value.find(u => u.id === userId)
    if (user) (user as any).plan = plan
    showToast(`Plan set to ${plan === 'pro' ? 'Pro' : 'Free'}`, 'success')
  } catch {
    showToast('Could not change the plan.', 'error')
    loadUsers()
  }
}

// Filters and Pagination State
const searchQuery = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const perPage = ref(10)

// Toast State
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')
const isUpdatingRole = ref<number | null>(null)

const loadUsers = async () => {
  if (profile.value?.role !== 'admin') return
  
  await fetchUsers({
    search: searchQuery.value || undefined,
    role: roleFilter.value || undefined,
    page: currentPage.value,
    per_page: perPage.value
  })
}

const applyFilters = () => {
  currentPage.value = 1
  loadUsers()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const handleRoleChange = async (userId: number, newRole: string) => {
  isUpdatingRole.value = userId
  try {
    await updateUserRole(userId, newRole)
    
    // Update local state without full refetch
    const user = users.value.find(u => u.id === userId)
    if (user) {
      user.role = newRole
    }
    
    showToast(`User role successfully updated to ${newRole}`, 'success')
  } catch (err: any) {
    showToast(error.value || 'Failed to update role. Please try again.', 'error')
    // Reset select by reloading users
    loadUsers()
  } finally {
    isUpdatingRole.value = null
  }
}

const showToast = (message: string, type: 'success' | 'error') => {
  toastMessage.value = message
  toastType.value = type
  setTimeout(() => {
    toastMessage.value = ''
  }, 3000)
}

// Helpers
const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A'
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch (e) {
    return dateString
  }
}

const capitalize = (str: string) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

onMounted(() => {
  loadUsers()
})
</script>
