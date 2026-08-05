import { ref } from 'vue';
import { toProxiedThumb } from '~/utils/thumbUrl';

export interface Notification {
    id: number;
    course_id: number;
    sender_id: number;
    receiver_id: number;
    status: string;
    created_at: string;
    course: {
        course_id: number;
        course_title: string;
        course_thumb: string;
    };
}

export function useNotifications() {
    const notifications = ref<Notification[]>([]);
    const loading = ref(false);
    const unreadCount = computed(() => notifications.value.length);

    const fetchNotifications = async () => {
        loading.value = true;
        try {
            const data = await $fetch<Notification[]>('/api/notifications', { method: 'GET' });
            data?.forEach((n) => {
                if (n.course) n.course.course_thumb = toProxiedThumb(n.course.course_thumb)
            });
            notifications.value = data || [];
        } catch (e) {
            console.error('Failed to fetch notifications', e);
        } finally {
            loading.value = false;
        }
    };

    const respondToInvite = async (id: number, action: 'accept' | 'decline') => {
        try {
            await $fetch(`/api/invitations/${id}/respond`, {
                method: 'POST',
                body: { action }
            });
            // Remove from list after responding
            notifications.value = notifications.value.filter(n => n.id !== id);
            return true;
        } catch (e) {
            console.error(`Failed to ${action} invite`, e);
            return false;
        }
    };

    return {
        notifications,
        loading,
        unreadCount,
        fetchNotifications,
        respondToInvite
    };
}
