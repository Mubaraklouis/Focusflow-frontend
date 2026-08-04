<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Bell, Check, X, Inbox } from 'lucide-vue-next';
import { useNotifications } from '~/composables/useNotifications';
import { Button } from '@/components/ui/button';

const { notifications, loading, unreadCount, fetchNotifications, respondToInvite } = useNotifications();
const isOpen = ref(false);

onMounted(() => {
    fetchNotifications();
});

const togglePopover = () => {
    isOpen.value = !isOpen.value;
    if (isOpen.value) fetchNotifications();
};

const handleRespond = async (id: number, action: 'accept' | 'decline') => {
    await respondToInvite(id, action);
};
</script>

<template>
    <div class="relative">
        <button 
            @click="togglePopover"
            class="relative flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
            <Bell class="h-5 w-5" />
            <span v-if="unreadCount > 0" class="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold border-2 border-background">
                {{ unreadCount }}
            </span>
        </button>

        <div v-if="isOpen" class="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm shadow-xl p-4 z-50">
            <div class="flex items-center justify-between mb-4 pb-2 border-b">
                <h3 class="font-semibold text-foreground">Notifications</h3>
                <span class="text-xs text-muted-foreground">{{ unreadCount }} unread</span>
            </div>
            
            <div v-if="loading && notifications.length === 0" class="flex justify-center p-4">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
            
            <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-8 text-center">
                <Inbox class="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p class="text-sm text-muted-foreground">No new notifications</p>
            </div>
            
            <div v-else class="space-y-3 max-h-96 overflow-y-auto pr-1">
                <div v-for="notif in notifications" :key="notif.id" class="p-3 bg-muted/30 rounded-lg border border-border/50 transition-colors hover:bg-muted/50">
                    <p class="text-sm text-foreground mb-2">
                        You have been invited to join the course <span class="font-semibold">{{ notif.course?.course_title || 'Unknown Course' }}</span>.
                    </p>
                    <div class="flex gap-2 justify-end mt-2">
                        <Button size="sm" variant="outline" @click="handleRespond(notif.id, 'decline')" class="h-7 text-xs border-destructive/20 text-destructive hover:bg-destructive/10">
                            <X class="h-3 w-3 mr-1" /> Decline
                        </Button>
                        <Button size="sm" @click="handleRespond(notif.id, 'accept')" class="h-7 text-xs">
                            <Check class="h-3 w-3 mr-1" /> Accept
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Click outside overlay (simple) -->
        <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40"></div>
    </div>
</template>
