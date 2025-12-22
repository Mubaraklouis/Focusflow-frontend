<script setup lang="ts">
    import { ref } from 'vue';
    
    const isYearly = ref(false);
    
    const toggleBilling = () => {
        isYearly.value = !isYearly.value;
    };
    
    const getPrice = (monthlyPrice: number) => {
        if (isYearly.value) {
            const yearlyPrice = monthlyPrice * 12 * 0.8; // 20% discount for yearly
            return Math.round(yearlyPrice / 12);
        }
        return monthlyPrice;
    };
    
    const getYearlySavings = (monthlyPrice: number) => {
        const yearlyPrice = monthlyPrice * 12 * 0.8;
        const savings = (monthlyPrice * 12) - yearlyPrice;
        return Math.round(savings);
    };
    </script>
    <template>
    <div id="pricing">
        <div class="sm:flex sm:flex-col sm:align-center p-10">
        <div class="relative self-center bg-border rounded-lg p-0.5 flex">
            <button type="button"
                @click="toggleBilling"
                :class="[
                    'relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none sm:w-auto sm:px-8 transition-colors',
                    !isYearly ? 'bg-background border-border text-foreground shadow-sm' : 'border-transparent text-foreground'
                ]">Monthly
                billing
            </button>
            <button type="button"
                @click="toggleBilling"
                :class="[
                    'ml-0.5 relative w-1/2 border rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none sm:w-auto sm:px-8 transition-colors',
                    isYearly ? 'bg-background border-border text-foreground shadow-sm' : 'border-transparent text-foreground'
                ]">Yearly
                billing
            </button>
        </div>
        <div
            class="mt-12 space-y-3 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 md:max-w-5xl md:mx-auto xl:grid-cols-3">
            <div class="border border-border rounded-lg shadow-sm divide-y divide-border bg-background">
                <div class="p-6">
                    <h2 class="text-xl leading-6 font-bold text-foreground">Basic</h2>
                    <p class="mt-2 text-base text-muted-foreground leading-tight">Perfect for students getting started with task management.</p>
                    <p class="mt-8">
                        <span class="text-4xl font-bold text-foreground tracking-tighter">${{ getPrice(0) }}</span>
                        <span class="text-base font-medium text-muted-foreground">/mo</span>
                    </p>
                    <a href="/sign-up"
                        class="mt-8 block w-full bg-primary hover:bg-primary/90 transition-colors rounded-md py-2 text-sm font-semibold text-white text-center">Get Started Free</a>
                </div>
                <div class="pt-6 pb-8 px-6">
                    <h3 class="text-sm font-bold text-foreground tracking-wide uppercase">Features included</h3>
                    <ul role="list" class="mt-4 space-y-3">
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Basic task management</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Simple Pomodoro timer</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Basic note organization</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="border border-border rounded-lg shadow-sm divide-y divide-border bg-background relative">
                <div class="absolute -top-4 right-8 rounded-full bg-primary px-3 py-1 text-sm text-white font-semibold">Popular</div>
                <div class="p-6">
                    <h2 class="text-xl leading-6 font-bold text-foreground">Pro</h2>
                    <p class="mt-2 text-base text-muted-foreground leading-tight">Enhanced features for serious students and professionals.</p>
                    <p class="mt-8">
                        <span class="text-4xl font-bold text-foreground tracking-tighter">${{ getPrice(8) }}</span>
                        <span class="text-base font-medium text-muted-foreground">/mo</span>
                        <span v-if="isYearly" class="ml-2 text-sm text-green-500">Save ${{ getYearlySavings(8) }}/year</span>
                    </p>
                    <a href="/sign-up"
                        class="mt-8 block w-full bg-primary hover:bg-primary/90 transition-colors rounded-md py-2 text-sm font-semibold text-white text-center">Upgrade to Pro</a>
                </div>
                <div class="pt-6 pb-8 px-6">
                    <h3 class="text-sm font-bold text-foreground tracking-wide uppercase">Everything in Basic, plus</h3>
                    <ul role="list" class="mt-4 space-y-3">
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">AI-powered quiz generation</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Advanced study analytics</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Create study groups</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Calendar integration</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="border border-border rounded-lg shadow-sm divide-y divide-border bg-background">
                <div class="p-6">
                    <h2 class="text-xl leading-6 font-bold text-foreground">Enterprise</h2>
                    <p class="mt-2 text-base text-muted-foreground leading-tight">Custom solutions for educational institutions.</p>
                    <p class="mt-8">
                        <span class="text-4xl font-bold text-foreground tracking-tighter">${{ getPrice(15) }}</span>
                        <span class="text-base font-medium text-muted-foreground">/mo</span>
                        <span v-if="isYearly" class="ml-2 text-sm text-green-500">Save ${{ getYearlySavings(15) }}/year</span>
                    </p>
                    <a href="/sign-up"
                        class="mt-8 block w-full bg-primary hover:bg-primary/90 transition-colors rounded-md py-2 text-sm font-semibold text-white text-center">Contact Sales</a>
                </div>
                <div class="pt-6 pb-8 px-6">
                    <h3 class="text-sm font-bold text-foreground tracking-wide uppercase">Everything in Pro, plus</h3>
                    <ul role="list" class="mt-4 space-y-3">
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Custom branding</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Priority support</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">Advanced analytics dashboard</span>
                        </li>
                        <li class="flex space-x-3">
                            <svg xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 h-5 w-5 text-green-400" width="24"
                                height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                                <path d="M5 12l5 5l10 -10"></path>
                            </svg>
                            <span class="text-base text-muted-foreground">API access</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
    </div>
    </template>
    