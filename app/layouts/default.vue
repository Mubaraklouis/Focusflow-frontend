<template>
  <div class="flex flex-col min-h-screen">
    <Navbar />
    <main class="flex-1 p-8">
      <slot />
    </main>
    <Footer />
  </div>
</template>
