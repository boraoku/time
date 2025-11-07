/**
 * BannerModule - Manages the iOS App promotional banner
 * Shows banner when user displays clocks
 */

const BannerModule = {
    banner: null,

    /**
     * Initialize the banner module
     */
    init() {
        this.banner = document.getElementById('ios-banner');

        if (!this.banner) {
            console.error('Banner element not found');
            return;
        }

        console.log('✓ Banner element found');
    },

    /**
     * Show the banner with animation (1 second delay)
     */
    showBanner() {
        if (!this.banner) {
            console.error('Cannot show banner - element not found');
            return;
        }

        console.log('Showing banner in 1 second...');

        // Wait 1 second before showing banner
        setTimeout(() => {
            this.banner.classList.remove('hidden');
            this.banner.classList.add('show');
            console.log('✓ Banner shown');
        }, 1000);
    }
};

export default BannerModule;
