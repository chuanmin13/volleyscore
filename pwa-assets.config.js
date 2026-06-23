import {
  combinePresetAndAppleSplashScreens,
  defineConfig,
  minimalPreset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: combinePresetAndAppleSplashScreens(
    minimalPreset,
    {
      padding: 0.45,
      resizeOptions: { background: '#485696' },
      darkResizeOptions: { background: '#1a2347' },
      linkMediaOptions: {
        log: true,
        addMediaScreen: true,
        basePath: '/',
        xhtml: false,
      },
    },
  ),
  images: ['public/scoreCalc-icon.svg'],
})
