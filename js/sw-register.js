/**
 * PNN - Service Worker Registration
 * Enables offline functionality and PWA installation
 */

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered successfully:', registration.scope);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New content available
                        console.log('New content available, please refresh.');
                        
                        // Show update notification (optional)
                        if (confirm('Доступна новая версия приложения. Обновить?')) {
                            window.location.reload();
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    });
}

// Register for PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    console.log('PWA install prompt ready');
});

// Function to show install prompt (can be called from UI)
async function showInstallPrompt() {
    if (!deferredPrompt) {
        console.log('Install prompt not available');
        return false;
    }
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    
    // Reset the prompt
    deferredPrompt = null;
    
    return outcome === 'accepted';
}

// Make available globally
window.showInstallPrompt = showInstallPrompt;

// Handle app installed event
window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
});
