<script setup lang="ts">
    // 1. Import the useTheme composable (assuming it's available globally in Nuxt or via explicit path)
    import { useTheme } from '#imports'; 
    
    // 2. Initialize the dynamic theme state
    const { isDark } = useTheme();
    
    // 3. Simple function to get the current year for the copyright notice
    const currentYear = new Date().getFullYear(); 
    </script>
    
    <template>
        <footer 
            class="border-t border-border pt-16 pb-8 px-6 md:px-8"
            :class="isDark ? 'bg-muted text-muted-foreground' : 'bg-[#fff0e8] text-foreground'"
        >
            <div class="max-w-7xl mx-auto">
                <div class="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-y-12 md:gap-x-8 mb-16">
                    
                    <div class="md:col-span-5 lg:col-span-6 max-w-md">
                        <h3 class="text-lg font-semibold mb-2 text-foreground">Keep up to date</h3>
                        <p class="mb-4 text-muted-foreground text-sm">Join our quarterly newsletter, "You've got mail."</p>
                        <div class="mt-4 flex space-x-2">
                            <input type="email" placeholder="Enter email address..."
                                   class="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <button class="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center justify-center font-medium hover:bg-primary/90 transition-colors text-sm h-10 shrink-0">
                                    Subscribe
                            </button>
                        </div>
                    </div>
        
                    <div class="hidden md:block md:col-span-1 lg:col-span-1"></div>
        
                    <div
                        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 col-span-1 md:col-span-6 lg:col-span-5 gap-y-8 sm:gap-x-6 md:gap-x-8">
                        
                        <div>
                            <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Company</h3>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">About</a></li>
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Careers</a></li>
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Press</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Product</h3>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Features</a></li>
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</a></li>
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Docs</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h3 class="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Legal</h3>
                            <ul class="space-y-2">
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                                <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                                 <li><a href="#" class="text-sm text-muted-foreground hover:text-primary transition-colors">Sitemap</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
        
                <div class="pt-8 border-t border-border">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div class="flex items-center space-x-2 mb-4 md:mb-0">
                           <span class="font-semibold text-primary text-sm mr-2">FocusFlow</span>
                            <p class="text-xs text-muted-foreground">
                                © **{{ currentYear }}**. All Rights Reserved.
                            </p>
                        </div>
                        <div class="flex space-x-4 items-center">
                            <a href="#" class="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook">
                               <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v2.385z"/></svg>
                            </a>
                            <a href="#" class="text-muted-foreground hover:text-primary transition-colors" aria-label="GitHub">
                               <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                            </a>
                            <a href="#" class="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.782-6.98.059-1.28.073-1.689.073-4.947s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.689-.073-4.948-.073zM12 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                             <a href="#" class="text-muted-foreground hover:text-primary transition-colors" aria-label="X / Twitter">
                                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    </template>