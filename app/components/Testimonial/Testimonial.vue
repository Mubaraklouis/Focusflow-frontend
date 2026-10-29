<script setup lang="ts">
    import { computed, ref } from 'vue';
    
    // --- CARDS (13 items for the 4/5/4 layout) ---
    // What FocusFlow does for each kind of user. Swap these for real
    // testimonials (name, position, feedback, rating) once users send them.
    const testimonials = ref([
        // First column (items 1-4): who it is for
        { id: 1, name: "Lecturers", position: "Teach the course you already have", feedback: "Bring the PowerPoint or PDF course you already teach. Students read your slides page by page, exactly as you wrote them." },
        { id: 2, name: "Self-learners", position: "Learning on your own", feedback: "Turn YouTube videos and your notes into short units, with the AI drafting each lesson from your sources for you to edit." },
        { id: 3, name: "Schools and universities", position: "Institutions", feedback: "Add your lecturers, let them invite their classes, and keep a record of each student's consent to share results." },
        { id: 4, name: "Students", position: "Taking a course", feedback: "Join for free with a link or code, finish one unit at a time, and see your own progress as you go." },

        // Middle column (items 5-9): quizzes and exams
        { id: 5, name: "Unit quizzes", position: "After every unit", feedback: "A short quiz checks each unit before the next one opens." },
        { id: 6, name: "Final exams", position: "At the end of the course", feedback: "A final exam closes the course, with the time window, timer and access code you choose." },
        { id: 7, name: "Question import", position: "Bring your question bank", feedback: "Import questions from CSV, GIFT or Aiken files instead of typing them again." },
        { id: 8, name: "Explain your answer", position: "Fairer marking", feedback: "Learners explain their reasoning. The AI can suggest a mark, and you decide." },
        { id: 9, name: "Certificates", position: "When learners finish", feedback: "Every certificate has a code that anyone can check online." },

        // Last column (items 10-13): how it works
        { id: 10, name: "Your teaching stays yours", position: "Slides as written", feedback: "The AI only suggests where units start and end and finds outside references. It never rewrites your slides." },
        { id: 11, name: "AI with limits", position: "Spending you can see", feedback: "Every AI call is logged with its cost, and each creator has a daily and monthly allowance." },
        { id: 12, name: "Publish early", position: "Long PDFs and videos", feedback: "Long materials are read in parts, so you can publish the first units while the rest is still being read." },
        { id: 13, name: "Open source", position: "Code on GitHub", feedback: "FocusFlow's API and web app are open source under the AGPL-3.0.", url: "https://github.com/FoucFlow/focusflow-api" },
    ]);
    
    // Column splitting logic is unchanged and works fine with local data.
    const column1Testimonials = computed(() => { return testimonials.value.slice(0, 4); });
    const column2Testimonials = computed(() => { return testimonials.value.slice(4, 9); });
    const column3Testimonials = computed(() => { return testimonials.value.slice(9, 13); });
    
    // Function to generate initials and a placeholder URL
    const getInitialsPlaceholder = (name: string): string => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fc5522&color=FFFFFF&size=150&font-size=0.33`;
    };
    </script>
    
    <template>
        <div>
            <section id="testimonies" class="py-20 transition-colors duration-300 bg-[#FBF2E5] dark:bg-[#0F1729]">
                <div class="max-w-6xl mx-8 md:mx-10 lg:mx-20 xl:mx-auto">
                    <div class="transition duration-500 ease-in-out transform scale-100 translate-x-0 translate-y-0 opacity-100">
                        <div class="mb-12 space-y-5 md:mb-16 md:text-center">
                            <div class="inline-block px-3 py-1 text-sm font-semibold rounded-lg md:text-center text-cn hover:cursor-pointer bg-accent text-accent-foreground hover:bg-accent/80">
                                Who It's For
                            </div>
                            <h1 class="mb-5 text-3xl font-semibold md:text-center md:text-5xl text-primary">
                                Built for the way you teach and learn.
                            </h1>
                            <p class="text-xl md:text-center md:text-2xl text-foreground/80 dark:text-gray-100">
                                Here's what FocusFlow does for each person who uses it.
                            </p>
                        </div>
                    </div>
    
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        
                        <ul class="space-y-8">
                            <li v-for="testimonial in column1Testimonials" :key="testimonial.id" class="text-sm leading-6">
                                <div class="relative group">
                                    <div class="absolute transition rounded-lg opacity-15 -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 blur duration-400 group-hover:opacity-80 group-hover:duration-200"></div>
                                    <a :href="testimonial.url || '#'" :target="testimonial.url ? '_blank' : '_self'" class="cursor-pointer">
                                        <div class="relative p-6 space-y-6 leading-none rounded-lg bg-[#F5EDE2] border border-primary/30 dark:bg-[#1E293B] dark:border-none dark:ring-1 dark:ring-gray-900/5 transition-colors duration-300">
                                            <div class="flex items-center space-x-4">
                                                <img
                                                    :src="testimonial.photo || getInitialsPlaceholder(testimonial.name)"
                                                    class="w-12 h-12 bg-center bg-cover border rounded-full"
                                                    :alt="testimonial.name"
                                                >
                                                <div>
                                                    <h3 class="text-lg font-semibold text-foreground dark:text-white">{{ testimonial.name }}</h3>
                                                    <p class="text-md text-muted-foreground dark:text-gray-400">{{ testimonial.position || 'Customer' }}</p>
                                                </div>
                                            </div>
                                            <p class="leading-normal text-md text-foreground/80 dark:text-gray-300">{{ testimonial.feedback }}</p>
                                            <div v-if="testimonial.rating !== undefined && testimonial.rating !== null && testimonial.rating > 0" class="flex items-center">
                                                <span v-for="n in 5" :key="n" class="w-4 h-4" :class="n <= testimonial.rating ? 'text-yellow-400' : 'text-gray-300'">
                                                    &#9733;
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </li>
                        </ul>
    
                        <ul class="hidden space-y-8 sm:block">
                            <li v-for="testimonial in column2Testimonials" :key="testimonial.id" class="text-sm leading-6">
                                <div class="relative group">
                                    <div class="absolute transition rounded-lg opacity-15 -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 blur duration-400 group-hover:opacity-80 group-hover:duration-200"></div>
                                    <a :href="testimonial.url || '#'" :target="testimonial.url ? '_blank' : '_self'" class="cursor-pointer">
                                        <div class="relative p-6 space-y-6 leading-none rounded-lg bg-[#F5EDE2] border border-primary/30 dark:bg-[#1E293B] dark:border-none dark:ring-1 dark:ring-gray-900/5 transition-colors duration-300">
                                            <div class="flex items-center space-x-4">
                                                <img
                                                    :src="testimonial.photo || getInitialsPlaceholder(testimonial.name)"
                                                    class="w-12 h-12 bg-center bg-cover border rounded-full"
                                                    :alt="testimonial.name"
                                                >
                                                <div>
                                                    <h3 class="text-lg font-semibold text-foreground dark:text-white">{{ testimonial.name }}</h3>
                                                    <p class="text-md text-muted-foreground dark:text-gray-400">{{ testimonial.position || 'Customer' }}</p>
                                                </div>
                                            </div>
                                            <p class="leading-normal text-md text-foreground/80 dark:text-gray-300">{{ testimonial.feedback }}</p>
                                            <div v-if="testimonial.rating !== undefined && testimonial.rating !== null && testimonial.rating > 0" class="flex items-center">
                                                <span v-for="n in 5" :key="n" class="w-4 h-4" :class="n <= testimonial.rating ? 'text-yellow-400' : 'text-gray-300'">
                                                    &#9733;
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </li>
                        </ul>
    
                        <ul class="hidden space-y-8 lg:block">
                            <li v-for="testimonial in column3Testimonials" :key="testimonial.id" class="text-sm leading-6">
                                <div class="relative group">
                                    <div class="absolute transition rounded-lg opacity-15 -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 blur duration-400 group-hover:opacity-80 group-hover:duration-200"></div>
                                    <a :href="testimonial.url || '#'" :target="testimonial.url ? '_blank' : '_self'" class="cursor-pointer">
                                        <div class="relative p-6 space-y-6 leading-none rounded-lg bg-[#F5EDE2] border border-primary/30 dark:bg-[#1E293B] dark:border-none dark:ring-1 dark:ring-gray-900/5 transition-colors duration-300">
                                            <div class="flex items-center space-x-4">
                                                <img
                                                    :src="testimonial.photo || getInitialsPlaceholder(testimonial.name)"
                                                    class="w-12 h-12 bg-center bg-cover border rounded-full"
                                                    :alt="testimonial.name"
                                                >
                                                <div>
                                                    <h3 class="text-lg font-semibold text-foreground dark:text-white">{{ testimonial.name }}</h3>
                                                    <p class="text-md text-muted-foreground dark:text-gray-400">{{ testimonial.position || 'Customer' }}</p>
                                                </div>
                                            </div>
                                            <p class="leading-normal text-md text-foreground/80 dark:text-gray-300">{{ testimonial.feedback }}</p>
                                            <div v-if="testimonial.rating !== undefined && testimonial.rating !== null && testimonial.rating > 0" class="flex items-center">
                                                <span v-for="n in 5" :key="n" class="w-4 h-4" :class="n <= testimonial.rating ? 'text-yellow-400' : 'text-gray-300'">
                                                    &#9733;
                                                </span>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    </template>