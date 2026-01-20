<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Authentication Status</h1>
    
    <div v-if="isAuthenticated" class="bg-green-100 border border-green-400 rounded p-4">
      <h2 class="text-lg font-semibold text-green-800">✅ Authenticated</h2>
      <div class="mt-4">
        <p><strong>Name:</strong> {{ user?.name }}</p>
        <p><strong>Email:</strong> {{ user?.email }}</p>
        <p><strong>ID:</strong> {{ user?.id }}</p>
      </div>
      <button 
        @click="handleLogout" 
        class="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>

    <div v-else class="bg-red-100 border border-red-400 rounded p-4">
      <h2 class="text-lg font-semibold text-red-800">❌ Not Authenticated</h2>
      <p class="mt-2">You are not logged in.</p>
      <NuxtLink to="/register" class="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Go to Register
      </NuxtLink>
    </div>

    <div class="mt-6">
      <button 
        @click="checkAuthStatus" 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Check Auth Status
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/Auth/useAuth'
import { useLogout } from '~/composables/Auth/useLogout'

const { isAuthenticated, checkAuth } = useAuth()
const { logout } = useLogout()

// Store user data separately since useAuth only handles authentication status
const user = ref<{ id?: number; name?: string; email?: string } | null>(null)

// Fetch user data from the API
const fetchUser = async () => {
  try {
    const data = await $fetch('/api/user', { credentials: 'include' })
    user.value = data as { id?: number; name?: string; email?: string }
    return data
  } catch (error) {
    user.value = null
    throw error
  }
}

// Check authentication status on mount
onMounted(async () => {
  const isAuth = await checkAuth()
  if (isAuth) {
    try {
      await fetchUser()
    } catch (error) {
      console.log('Failed to fetch user data')
    }
  }
})

const checkAuthStatus = async () => {
  const isAuth = await checkAuth()
  if (isAuth) {
    try {
      await fetchUser()
      console.log('User is authenticated:', user.value)
    } catch (error) {
      console.log('Failed to fetch user data')
    }
  } else {
    console.log('User is not authenticated')
  }
}

const handleLogout = async () => {
  await logout()
  user.value = null
}
</script>

