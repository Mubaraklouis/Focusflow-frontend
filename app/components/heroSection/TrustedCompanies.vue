<script setup lang="ts">
</script>
<template>
    <div class="py-16 overflow-hidden bg-background/50">
        <div class="text-center mb-10">
            <h3 class="text-2xl font-bold">Trusted by</h3>
        </div>
        <div class="relative max-w-5xl mx-auto">
            <div class="flex animate-scroll gap-x-10 md:gap-x-16 items-center justify-center">
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/google.png"
                         alt="Google"
                         loading="lazy">
                </div>
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/udemy-Logo.wine.png"
                         alt="Udemy"
                         loading="lazy">
                </div>
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/62a4c8c5fdee15d2905007ca.png"
                         alt="Company"
                         loading="lazy">
                </div>
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/codecademy-logo-vector.png"
                         alt="Codecademy"
                         loading="lazy">
                </div>
                <!-- Duplicate logos for seamless animation -->
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/google.png"
                         alt="Google"
                         loading="lazy">
                </div>
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/udemy-Logo.wine.png"
                         alt="Udemy"
                         loading="lazy">
                </div>
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/62a4c8c5fdee15d2905007ca.png"
                         alt="Company"
                         loading="lazy">
                </div>
                <div class="flex-shrink-0">
                    <img class="w-20 md:w-24 h-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                         src="/assets/images/codecademy-logo-vector.png"
                         alt="Codecademy"
                         loading="lazy">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-scroll {
    animation: scroll 30s linear infinite;
}

@keyframes scroll {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-50%);
    }
}

/* Pause animation on hover */
.animate-scroll:hover {
    animation-play-state: paused;
}

/* Add a subtle gradient fade on the sides */
.relative::before,
.relative::after {
    content: '';
    position: absolute;
    top: 0;
    width: 150px;
    height: 100%;
    z-index: 2;
    pointer-events: none;
}

.relative::before {
    left: 0;
    background: linear-gradient(to right, var(--background) 0%, transparent 100%);
}

.relative::after {
    right: 0;
    background: linear-gradient(to left, var(--background) 0%, transparent 100%);
}
</style>