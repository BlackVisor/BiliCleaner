import {type FC, useEffect, useRef, useState} from 'react'
import './App.css'
import {getSegments, parseVideoId, type Segment} from "./utils/video.ts"

// interface RedundantTypeConfig {
//     color: string,
//     skip: boolean
// }

// enum RedundantType {
//     SPONSOR = 'SPONSOR',
//     PROMOTION = 'PROMOTION',
//     INTERACTION = 'INTERACTION',
//     BEGINNING = 'BEGINNING',
//     ENDING = 'ENDING',
//     PREVIEW = 'PREVIEW',
//     MUSIC = 'MUSIC',
//     FILLER = 'FILLER',
// }

// const redundantTypeConfig: Record<RedundantType, RedundantTypeConfig> = {
//     [RedundantType.SPONSOR]: { color: 'green', skip: true },
//     [RedundantType.PROMOTION]: { color: 'red', skip: true },
//     [RedundantType.INTERACTION]: {color: ''}
// }

const videoSelectors = [".bpx-player-video-area video", ".bilibili-player video", "video"]
// 查找视频播放器的核心函数
const findVideoElement = () => {
    let videoElement: HTMLVideoElement | null = null
    for (const selector of videoSelectors) {
        videoElement = document.querySelector(selector)
        if (videoElement) break
    }
    return videoElement
}
const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = Math.floor((totalSeconds % 3600) - 60 * minutes)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const BiliCleaner: FC = () => {
    const [segments, setSegments] = useState<Segment[]>([])
    const [videoId, setVideoId] = useState<string>('')
    const videoIdRef = useRef<string>(videoId)
    // 用来存储最新的videoElement
    const videoElementRef = useRef<HTMLVideoElement | null>(null) // 保存播放器实例
    // 用来拿到最新的videoElement
    const observerRef = useRef<MutationObserver | null>(null)
    const checkIntervalRef = useRef<number | null>(null)

    // url change listener from native
    useEffect(() => {
        const handleUrlChange = () => {
            const newVideoId = parseVideoId(window.location.href)
            if (newVideoId === videoIdRef.current) return
            if (newVideoId) {
                videoIdRef.current = newVideoId
                console.log(`[BC] video id in url changed: ${videoIdRef.current} -> ${newVideoId}`)
                setVideoId(newVideoId)
            }
        }

        (window as Window & { onurlchange?: ((event: Event) => void) | null }).onurlchange = handleUrlChange

        // 关键修复：首次加载主动调用一次，捕获初始URL
        handleUrlChange()
        // }

        return () => {
            (window as Window & { onurlchange?: ((event: Event) => void) | null }).onurlchange = null
        }
    }, [])

    // update segments by video id
    useEffect(() => {
        let pollTimer: number | null = null // 兜底定时器
        // 2. fetch segments by new video id
        if (videoId) getSegments(videoId)
            .then(data => {
                setSegments(data)
                if (data.length) {
                    const segmentsLog = data.filter(x => x.segment.length === 2).map(y => `[${formatTime(y.segment[0])}-${formatTime(y.segment[1])}]`).join(', ')
                    console.log(`[BC] ${videoId} segments loaded: ${segmentsLog}`)
                }
            })
            .then(() => {
                // 3. get video element
                if (!videoElementRef.current) {
                    // 尝试立即获取播放器
                    const videoElement = findVideoElement()
                    if (videoElement) {
                        videoElementRef.current = videoElement
                        console.log('[BC] video player element got immediately')
                    } else {
                        // 播放器未加载，用 MutationObserver 监听 DOM 变化
                        observerRef.current = new MutationObserver((mutations) => {
                            for (const mutation of mutations) {
                                if (mutation.addedNodes.length) {
                                    const newVideoElement = findVideoElement()
                                    if (newVideoElement && !videoElementRef.current) {
                                        videoElementRef.current = newVideoElement
                                        observerRef.current?.disconnect() // 找到后停止监听
                                        console.log('[BC] video player element got dynamically')
                                        break
                                    }
                                }
                            }
                        })

                        // 监听播放器容器的 DOM 变化
                        const playerContainer = document.querySelector('.bpx-player-container') || document.body
                        observerRef.current.observe(playerContainer, {
                            childList: true,
                            subtree: true
                        })

                        // 兜底：10秒轮询
                        pollTimer = window.setTimeout(() => {
                            const pollVideoElement = findVideoElement()
                            if (pollVideoElement && !videoElementRef.current) {
                                videoElementRef.current = pollVideoElement
                                observerRef.current?.disconnect()
                                console.log('[BC] video player element got by 10s fallback')
                            }
                        }, 10000)
                    }
                }
            })
        // 统一清理函数（整合所有需要清理的资源）
        return () => {
            // 清理播放器监听
            if (videoElementRef.current) {
                videoElementRef.current = null
            }
            // 清理 DOM 观察者
            if (observerRef.current) {
                observerRef.current.disconnect()
                observerRef.current = null
            }
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current)
                checkIntervalRef.current = null
            }
            // 清理兜底定时器
            if (pollTimer) {
                clearTimeout(pollTimer)
            }
        }
    }, [videoId])

    // add interval to skip when segments update
    useEffect(() => {
        const clear = () => {
            if (checkIntervalRef.current) {
                clearInterval(checkIntervalRef.current)
                checkIntervalRef.current = null
            }
        }
        if (segments.length) {
            clear()
            if (videoElementRef.current) {
                checkIntervalRef.current = setInterval(() => {
                    if (videoElementRef.current
                        && !videoElementRef.current.paused
                        && !videoElementRef.current.ended
                        && videoElementRef.current.readyState >= 2
                    ) {
                        for (const video of segments) {
                            if (video.segment.length === 2) {
                                const [start, end] = video.segment
                                // valid segment should longer than 3s
                                if (end - start >= 3
                                    && videoElementRef.current.currentTime >= start
                                    && videoElementRef.current.currentTime <= end

                                ) {
                                    console.log(`[BC] skip from ${formatTime(videoElementRef.current.currentTime)} to ${formatTime(end)}`)
                                    videoElementRef.current.currentTime = end
                                }
                            }
                        }
                    }
                }, 3000)
            }
        }
        return clear
    }, [segments])

    return <></>
}

export default BiliCleaner