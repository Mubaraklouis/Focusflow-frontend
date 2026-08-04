import { ref } from 'vue'

export function useEnrollment() {
  const myEnrollments = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const enrollInCourse = async (courseId: number) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch(`/api/courses/course/${courseId}/enroll`, {
        method: 'POST'
      })
      return response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to enroll in course'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const unenrollFromCourse = async (courseId: number) => {
    isLoading.value = true
    error.value = null
    try {
      await $fetch(`/api/courses/course/${courseId}/enroll`, {
        method: 'DELETE'
      })
      myEnrollments.value = myEnrollments.value.filter(e => e.course_id !== courseId)
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to unenroll from course'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchMyEnrollments = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<any[]>('/api/courses/enrollments')
      myEnrollments.value = response
    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to fetch enrollments'
      console.error('Error fetching enrollments:', err)
    } finally {
      isLoading.value = false
    }
  }

  const isEnrolled = (courseId: number) => {
    return myEnrollments.value.some(e => e.course_id === courseId)
  }

  return { myEnrollments, isLoading, error, enrollInCourse, unenrollFromCourse, fetchMyEnrollments, isEnrolled }
}
