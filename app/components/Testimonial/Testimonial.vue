<script setup lang="ts">
    import { computed, ref } from 'vue';
    // 1. Importing YOUR dynamic useTheme composable
   import { useTheme } from '#imports';
    
    // 2. Initializing the dynamic theme tracking
    const { isDark } = useTheme(); 
    
    // --- STATIC TESTIMONIAL DATA (13 Items for 4/5/4 layout) ---
    const testimonials = ref([
        { id: 1, name: "Sarah Johnson", position: "CEO at TechFlow", feedback: "The architecture scales effortlessly. It provided the robustness we needed for rapid growth.", rating: 5, photo: "https://i.pravatar.cc/150?u=a042581f4e29026024d", url: '#' },
        { id: 2, name: "Michael Chen", position: "Lead Developer", feedback: "Simply the best tooling we've used in years. The built-in UI components saved us weeks of development time.", rating: 5, photo: "https://i.pravatar.cc/150?u=a042581f4e29026704d", url: '#' },
        { id: 3, name: "Jessica Davis", position: "Product Manager", feedback: "Incredible attention to detail. The team really understood our needs and delivered a solution that exceeded expectations.", rating: 4, photo: "https://i.pravatar.cc/150?u=a04258114e29026302d", url: '#' },
        { id: 4, name: "Ryan Patel", position: "Founding Engineer", feedback: "The integration process was seamless. We migrated our entire backend without a single hitch. Highly recommended for any enterprise.", rating: 5, photo: "https://i.pravatar.cc/150?u=b04258114e29026302d", url: '#' },
        
        // Middle Column (Items 5-9)
        { id: 5, name: "Alice Brown", position: "Marketing Strategist", feedback: "Our conversion rates jumped immediately after implementing their front-end system. Clean, fast, and effective.", rating: 4, photo: "https://i.pravatar.cc/150?u=c04258114e29026302d", url: '#' },
        { id: 6, name: "David Kim", position: "VP of Operations", feedback: "The support team is fantastic—responsive and extremely knowledgeable. A huge asset to our small team.", rating: 5, photo: "https://i.pravatar.cc/150?u=d04258114e29026302d", url: '#' },
        { id: 7, name: "Emily White", position: "Data Scientist", feedback: "Built on modern principles, the code is easy to audit and maintain. A true developer-friendly product.", rating: 5, photo: "https://i.pravatar.cc/150?u=e04258114e29026302d", url: '#' },
        { id: 8, name: "Frank Miller", position: "Freelance Designer", feedback: "The component library is incredibly flexible. I was able to customize everything while maintaining accessibility standards.", rating: 4, photo: "https://i.pravatar.cc/150?u=f04258114e29026302d", url: '#' },
        { id: 9, name: "Grace Lee", position: "Startup Founder", feedback: "This solution allowed us to launch months ahead of schedule. Essential for any fast-moving project.", rating: 5, photo: "https://i.pravatar.cc/150?u=g04258114e29026302d", url: '#' },
        
        // Last Column (Items 10-13)
        { id: 10, name: "Henry Walker", position: "CTO at Innovate", feedback: "A flawless experience from development to deployment. The performance boost was immediately noticeable.", rating: 5, photo: "https://i.pravatar.cc/150?u=h04258114e29026302d", url: '#' },
        { id: 11, name: "Ivy King", position: "Senior Analyst", feedback: "The documentation is clear and comprehensive. We barely needed to reach out for external help.", rating: 4, photo: "https://i.pravatar.cc/150?u=i04258114e29026302d", url: '#' },
        { id: 12, name: "Jacob Scott", position: "E-commerce Lead", feedback: "Handles high traffic volumes with ease. We finally found a platform that grows with our demand.", rating: 5, photo: "https://i.pravatar.cc/150?u=j04258114e29026302d", url: '#' },
        { id: 13, name: "Kelly Zhao", position: "Content Creator", feedback: "The aesthetic design is beautiful, and the user experience is intuitive. Our customers love it!", rating: 4, photo: "https://i.pravatar.cc/150?u=k04258114e29026302d", url: '#' },
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
    
    ---
    
    <template>
        <div>
            <section id="testimonies" class="py-20" :class="isDark ? 'bg-[#0F1729]' : 'bg-[#FBF2E5]'">
                <div class="max-w-6xl mx-8 md:mx-10 lg:mx-20 xl:mx-auto">
                    <div class="transition duration-500 ease-in-out transform scale-100 translate-x-0 translate-y-0 opacity-100">
                        <div class="mb-12 space-y-5 md:mb-16 md:text-center">
                            <div class="inline-block px-3 py-1 text-sm font-semibold rounded-lg md:text-center text-cn hover:cursor-pointer bg-accent text-accent-foreground hover:bg-accent/80">
                                Words from Others
                            </div>
                            <h1 class="mb-5 text-3xl font-semibold md:text-center md:text-5xl" :class="isDark ? 'text-primary' : 'text-primary'">
                                It's not just us.
                            </h1>
                            <p class="text-xl md:text-center md:text-2xl" :class="isDark ? 'text-gray-100' : 'text-foreground/80'">
                                Here's what others have to say about us.
                            </p>
                        </div>
                    </div>
    
                    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        
                        <ul class="space-y-8">
                            <li v-for="testimonial in column1Testimonials" :key="testimonial.id" class="text-sm leading-6">
                                <div class="relative group">
                                    <div class="absolute transition rounded-lg opacity-15 -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 blur duration-400 group-hover:opacity-80 group-hover:duration-200"></div>
                                    <a :href="testimonial.url || '#'" :target="testimonial.url ? '_blank' : '_self'" class="cursor-pointer">
                                        <div class="relative p-6 space-y-6 leading-none rounded-lg" :class="isDark ? 'bg-[#1E293B] ring-1 ring-gray-900/5' : 'bg-[#F5EDE2] border border-primary/30'">
                                            <div class="flex items-center space-x-4">
                                                <img
                                                    :src="testimonial.photo || getInitialsPlaceholder(testimonial.name)"
                                                    class="w-12 h-12 bg-center bg-cover border rounded-full"
                                                    :alt="testimonial.name"
                                                >
                                                <div>
                                                    <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-foreground'">{{ testimonial.name }}</h3>
                                                    <p class="text-md" :class="isDark ? 'text-gray-400' : 'text-muted-foreground'">{{ testimonial.position || 'Customer' }}</p>
                                                </div>
                                            </div>
                                            <p class="leading-normal text-md" :class="isDark ? 'text-gray-300' : 'text-foreground/80'">{{ testimonial.feedback }}</p>
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
                                        <div class="relative p-6 space-y-6 leading-none rounded-lg" :class="isDark ? 'bg-[#1E293B] ring-1 ring-gray-900/5' : 'bg-[#F5EDE2] border border-primary/30'">
                                            <div class="flex items-center space-x-4">
                                                <img
                                                    :src="testimonial.photo || getInitialsPlaceholder(testimonial.name)"
                                                    class="w-12 h-12 bg-center bg-cover border rounded-full"
                                                    :alt="testimonial.name"
                                                >
                                                <div>
                                                    <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-foreground'">{{ testimonial.name }}</h3>
                                                    <p class="text-md" :class="isDark ? 'text-gray-400' : 'text-muted-foreground'">{{ testimonial.position || 'Customer' }}</p>
                                                </div>
                                            </div>
                                            <p class="leading-normal text-md" :class="isDark ? 'text-gray-300' : 'text-foreground/80'">{{ testimonial.feedback }}</p>
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
                                        <div class="relative p-6 space-y-6 leading-none rounded-lg" :class="isDark ? 'bg-[#1E293B] ring-1 ring-gray-900/5' : 'bg-[#F5EDE2] border border-primary/30'">
                                            <div class="flex items-center space-x-4">
                                                <img
                                                    :src="testimonial.photo || getInitialsPlaceholder(testimonial.name)"
                                                    class="w-12 h-12 bg-center bg-cover border rounded-full"
                                                    :alt="testimonial.name"
                                                >
                                                <div>
                                                    <h3 class="text-lg font-semibold" :class="isDark ? 'text-white' : 'text-foreground'">{{ testimonial.name }}</h3>
                                                    <p class="text-md" :class="isDark ? 'text-gray-400' : 'text-muted-foreground'">{{ testimonial.position || 'Customer' }}</p>
                                                </div>
                                            </div>
                                            <p class="leading-normal text-md" :class="isDark ? 'text-gray-300' : 'text-foreground/80'">{{ testimonial.feedback }}</p>
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