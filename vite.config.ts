import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
import monkey, {cdn} from 'vite-plugin-monkey'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        monkey({
            entry: 'src/main.tsx',
            userscript: {
                name: 'bilicleaner',
                icon: 'data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%201024%201024%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M834.307%20432.093s67.731%2029.89%2062.994%20184.286l48.828%2048.766s51.971-119.645%2033.066-222.092c0%200-1.554-96.101-173.26-223.653%200%200-85.077%209.405-78.757-78.784l-67.731-67.764-122.881%20122.879%2059.855%2059.917s148.077%206.229%2096.105%20127.546l-222.098%20223.713-42.54-6.291-253.607%20253.607s-17.345%2061.411%2026.778%2099.215c0%200%2028.34%2034.69%2088.221%2033.072l248.868-258.341%204.738-42.54%20253.573-251.988s14.202-22.051%2037.84-1.554v0.003M353.842%20460.372l80.345%2080.398%20108.707-108.679-83.521-83.521c88.221-201.664-165.382-280.388-165.382-280.388-47.243-12.642-37.805%2023.6-37.805%2023.6%2099.246%2081.902%2083.489%20108.683%2083.489%20108.683-12.583%2094.54-94.512%20130.793-94.512%20130.793-81.899%2034.628-149.629-80.345-149.629-80.345-26.781-4.73-23.636%2025.227-23.636%2025.227%2066.171%20291.412%20281.943%20184.223%20281.943%20184.223v0.006M607.476%20723.443l250.431%20266.245%20122.884-122.879-263.075-253.607-110.239%20110.239M857.905%20808.517l50.951%2036.993-19.466%2059.917h-62.966l-19.433-59.917%2050.913-36.993M857.905%20808.517z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E',
                namespace: 'github/BlackVisor',
                license: 'GPL-3.0',
                version: 'v1.0.2',
                description: '实现B站视频中广告相关片段自动跳过',
                updateURL: 'https://github.com/BlackVisor/bilicleaner/releases/latest/download/bilicleaner.user.js', // Release Raw链接
                downloadURL: 'https://github.com/BlackVisor/bilicleaner/releases/latest/download/bilicleaner.user.js', // 和updateURL一致即可
                match: [
                    'https://*.bilibili.com/video/*',
                    'https://*.bilibili.com/list/watchlater*'
                ],
                exclude: ['https://live.bilibili.com/*'],
                grant: ['GM_xmlhttpRequest', 'unsafeWindow'],
                connect: ['www.bsbsb.top'],
                "run-at": "document-end"
            },
            build: {
                externalGlobals: {
                    // 如果不想把 React 打包进脚本以减小体积，可以引用 CDN
                    'react': cdn.npmmirror('React', 'umd/react.production.min.js'),
                    'react-dom': cdn.npmmirror('ReactDOM', 'umd/react-dom.production.min.js'),
                    'dayjs': cdn.npmmirror('dayjs', 'dayjs.min.js'),
                    'antd': cdn.npmmirror('antd', 'dist/antd.min.js'),
                },
            },
        }),
    ],
})
