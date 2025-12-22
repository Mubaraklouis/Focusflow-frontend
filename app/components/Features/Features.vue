<script setup lang="ts">
  import { useTheme } from '#imports';
    
    const { isDark } = useTheme();
    </script>
    
    
    <template>
    
        <div>
            <section class="relative overflow-hidden py-16" :class="isDark ? 'bg-background' : 'bg-[#FDF7ED]'">
                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div class="mx-auto text-center">
                        <h4 class="text-sm font-semibold uppercase tracking-wide ">Core Features</h4>
                        <h2 class="font-display text-3xl font-extrabold sm:text-4xl" :class="isDark ? 'text-primary' : 'text-primary'">Stay on Top of Your courses ,Projects With FocusFlow </h2>
                    </div>
                    <ul role="list"
                        class="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 text-sm sm:mt-20 sm:grid-cols-2 md:gap-y-10 lg:max-w-none lg:grid-cols-2">
                        <li class="group rounded-2xl border border-border p-8 transition-all duration-300 hover:border-primary/50" :class="isDark ? 'bg-background' : 'bg-background'">
                            <h3 class="font-bold text-lg flex items-center" :class="isDark ? 'text-white' : 'text-gray-900'">
                                <span>
                                    <svg aria-hidden="true" viewBox="0 0 24 24" class="w-[26px] mr-2" :class="isDark ? 'fill-white' : 'fill-[#061161]'" preserveAspectRatio="none">
                                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                    </svg>
                                </span>
                                Centralized Study Management
                            </h3>
                            <p class="mt-6 text-base" :class="isDark ? 'text-muted-foreground' : 'text-muted-foreground'">The platform enables users to track courses, projects, and deadlines in a unified dashboard. Users can organize and tag notes by subject or course while maintaining synchronization with external calendar systems for seamless scheduling.</p>
                        </li>
                        <li class="group rounded-2xl border border-border p-8 transition-all duration-300 hover:border-primary/50" :class="isDark ? 'bg-background' : 'bg-background'">
                            <h3 class="font-bold text-lg flex items-center" :class="isDark ? 'text-white' : 'text-gray-900'">
                                <span>
                                    <svg aria-hidden="true" viewBox="0 0 24 24" class="w-[26px] mr-2" :class="isDark ? 'fill-white' : 'fill-[#061161]'" preserveAspectRatio="none">
                                        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                                    </svg>
                                </span>
                                AI-Powered Learning Tools
                            </h3>
                            <p class="mt-6 text-base" :class="isDark ? 'text-muted-foreground' : 'text-muted-foreground'">FocusFlow automatically generates quizzes from user notes and creates adaptive flashcards that adjust to knowledge gaps.</p>
                        </li>
                        <li class="group rounded-2xl border border-border p-8 transition-all duration-300 hover:border-primary/50" :class="isDark ? 'bg-background' : 'bg-background'">
                            <h3 class="font-bold text-lg flex items-center" :class="isDark ? 'text-white' : 'text-gray-900'">
                                <span>
                                    <svg aria-hidden="true" viewBox="0 0 24 24" class="w-[26px] mr-2" :class="isDark ? 'fill-white' : 'fill-[#061161]'" preserveAspectRatio="none">
                                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                                    </svg>
                                </span>
                                Collaborative Study Features
                            </h3>
                            <p class="mt-6 text-base" :class="isDark ? 'text-muted-foreground' : 'text-muted-foreground'">Users can create and join study groups called Study Pods to share progress and resources.</p>
                        </li>
                        <li class="group rounded-2xl border border-border p-8 transition-all duration-300 hover:border-primary/50" :class="isDark ? 'bg-background' : 'bg-background'">
                            <h3 class="font-bold text-lg flex items-center" :class="isDark ? 'text-white' : 'text-gray-900'">
                                <span>
                                    <svg aria-hidden="true" viewBox="0 0 24 24" class="w-[26px] mr-2" :class="isDark ? 'fill-white' : 'fill-[#061161]'" preserveAspectRatio="none">
                                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>
                                    </svg>
                                </span>
                                Focus & Productivity Enhancement
                            </h3>
                            <p class="mt-6 text-base" :class="isDark ? 'text-muted-foreground' : 'text-muted-foreground'">A customizable Pomodoro timer with session tracking helps users maintain concentration.</p>
                        </li>
                    </ul>
                </div>
            </section>
    
        </div>
    </template>
    
    <style scoped>
    .group {
        position: relative;
        overflow: hidden;
    }
    
    .group::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-foreground) 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 0;
    }
    
    .group:hover::before {
        opacity: 0.08;
    }
    
    .group > * {
        position: relative;
        z-index: 1;
    }
    </style>
    