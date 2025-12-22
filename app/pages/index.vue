<template>
<div>
  <HeroSection/>
  <Features/>
  <Pricing/>
  <Testimonial/>
  <Contact/>
</div>
</template>

<script setup>
  import TrustedCompanies from '~/components/heroSection/TrustedCompanies.vue';
useHead({
  title: 'Home'
})
</script>
