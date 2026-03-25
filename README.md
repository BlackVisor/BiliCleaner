<p style="text-align: center">
  <img src="./src/assets/logo.svg" alt="Logo">
</p>

- 1.旨在将B站上影响体验的地方都净化掉，目前实现了广告跳过的能力（借鉴了[BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock)，同时后端api也是来自此项目）
- 2.通过vite+react+typescript构建（采用react主要是为了后期做一些页面上的功能扩展）
- 3.通过vite-plugin-monkey实现的build成tampermonkey上运行的用户脚本，为了少装扩展和足够轻量化
- 4.目前仅粗暴的实现了拿到广告片段后直接跳过，一些细分功能待后续开发

#### 致谢

感谢[ajayyy](https://github.com/ajayyy)的[SponsorBlock](https://github.com/ajayyy/SponsorBlock)和[hanydd](https://github.com/hanydd)的[BilibiliSponsorBlock](https://github.com/hanydd/BilibiliSponsorBlock)

#### 开源协议

本项目遵循 GNU GPL v3 开源协议。