<template>
    <div v-if="isMobileDevice"
        class="fixed inset-0 bg-yellow-50 z-50 flex flex-col items-center justify-center p-6 text-center">
        <div
            class="bg-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full">
            <div class="text-4xl mb-4">📱❌</div>
            <h1 class="text-2xl font-bold mb-4">Desktop Only</h1>
            <p class="text-gray-600 mb-4">
                This application requires Web Serial API, which is only available on desktop browsers like Chrome or
                Edge.
            </p>
            <div class="text-sm text-gray-500">
                Please visit this site from a desktop computer to use the WiFi Marauder interface.
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isMobileDevice = ref(false)

onMounted(() => {
    const checkMobile = () => {
        isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth <= 768
    }

    // Check on mount
    checkMobile()

    // Check on resize
    window.addEventListener('resize', checkMobile)

    // Cleanup
    onUnmounted(() => {
        window.removeEventListener('resize', checkMobile)
    })
})
</script>