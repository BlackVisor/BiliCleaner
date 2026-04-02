import {type FC, useEffect, useState} from 'react'
import {getSegments, Segment} from "../../utils/video.ts"
import {waitForElement} from "../../utils/host.ts"
import {formatTime} from "../../utils/common.ts"
import {useVideo} from "../../hooks/useVideo.tsx"
import {createPortal} from "react-dom";
import {useUserId} from "../../hooks/useUserId.ts";
import './SkipSegment.css'
import SegmentBar from "./SegmentBar.tsx";
import ReportSegmentModal from "./ReportSegmentModal.tsx";

const videoSelectors = [".bpx-player-video-area video", ".bilibili-player video", "video"]
// progress is bar when hovering on video player
const progressBarSelector = '.bpx-player-progress'
// shadow is bar at the bottom of video player
const shadowProgressBarSelector = '.bpx-player-shadow-progress-area'
const notPlayingEvents = ['pause', 'ended', 'waiting', 'seeking', 'stalled', 'suspend', 'emptied']
const videoToolbarRightSelector = '.video-toolbar-right'

const SkipSegment: FC = () => {
    const [segments, setSegments] = useState<Segment[]>([])
    const {bvId, chapterId} = useVideo()
    const userId = useUserId()
    const [playerElement, setPlayerElement] = useState<HTMLVideoElement | null>(null)
    const [progressBarElement, setProgressBarElement] = useState<HTMLDivElement | null>(null)
    const [shadowProgressBarElement, setShadowProgressBarElement] = useState<HTMLDivElement | null>(null)
    const [videoToolbarElement, setVideoToolbarElement] = useState<HTMLDivElement | null>(null)
    const [videoToolbarContainer, setVideoToolbarContainer] = useState<HTMLDivElement | null>(null)
    const [startTime, setStartTime] = useState<number>(0)
    const [endTime, setEndTime] = useState<number>(0)

    useEffect(() => {
        if (!bvId || !chapterId) return

        const initializer = async () => {
            try {
                setPlayerElement(null)
                setProgressBarElement(null)
                setShadowProgressBarElement(null)
                setVideoToolbarElement(null)

                const [elements, data] = await Promise.all([
                    Promise.all([
                        waitForElement(videoSelectors, HTMLVideoElement),
                        waitForElement([progressBarSelector], HTMLDivElement),
                        waitForElement([shadowProgressBarSelector], HTMLDivElement),
                        waitForElement([videoToolbarRightSelector], HTMLDivElement)
                    ]),
                    getSegments(bvId, chapterId)
                ])

                const [player, progressBar, shadowProgressBar, videoToolbar] = elements
                setPlayerElement(player)
                setProgressBarElement(progressBar)
                setShadowProgressBarElement(shadowProgressBar)
                setVideoToolbarElement(videoToolbar)
                console.log('[BC] player, progress bar, shadow progress bar, right video toolbar got')

                setSegments(data)
                if (data.length) console.log(`[BC] bv=${bvId} chapterId=${chapterId} segments loaded: ${data.map(y => `[${formatTime(y.start)}-${formatTime(y.end)}]`).join(', ')}`)
            } catch (error) {
                console.error(`[BC] initialization failed: ${error}`)
            }
        }

        void initializer()
    }, [bvId, chapterId])

    // add interval to skip when segments update and is playing
    useEffect(() => {
        if (!segments.length || !playerElement) return
        let checkInterval: number | undefined = undefined
        const onPlaying = () => {
            stopCheck()
            checkInterval = setInterval(() => {
                if (!playerElement.paused && !playerElement.ended && playerElement.readyState >= 2) {
                    for (const segment of segments) {
                        const {start, end} = segment
                        // valid segment should longer than 3s
                        if (end - start >= 3
                            && playerElement.currentTime >= start
                            && playerElement.currentTime <= end
                            // maybe some video source is replaced
                            && end < playerElement.duration
                        ) {
                            console.log(`[BC] skip from ${formatTime(playerElement.currentTime)} to ${formatTime(end)}`)
                            playerElement.currentTime = end
                        }
                    }
                }
            }, 2000)
            console.log('[BC] initialized interval to skip segment')
        }
        const stopCheck = () => {
            if (checkInterval) clearInterval(checkInterval)
            checkInterval = undefined
        }

        playerElement.addEventListener('playing', onPlaying)
        notPlayingEvents.forEach(eventType => playerElement.addEventListener(eventType, stopCheck))
        return () => {
            stopCheck()
            playerElement.removeEventListener('playing', onPlaying)
            notPlayingEvents.forEach(eventType => playerElement.removeEventListener(eventType, stopCheck))
        }
    }, [segments, playerElement])

    // attach report segment button, it is expected to prepend, so need create a container first
    useEffect(() => {
        if (!playerElement || !videoToolbarElement || !bvId || !chapterId || !userId) return
        // insert report dialog on the most left of video toolbar, like 'AI小助手' (if exists)
        const target = document.createElement('div')
        videoToolbarElement.prepend(target)
        setVideoToolbarContainer(target)
        return () => {
            target.remove()
        }

    }, [videoToolbarElement, bvId, chapterId, userId])

    return <>
        {
            progressBarElement && playerElement && createPortal(
                <SegmentBar isShadow={false} segments={segments} duration={playerElement.duration}/>,
                progressBarElement
            )
        }
        {
            shadowProgressBarElement && playerElement && createPortal(
                <SegmentBar isShadow={true} segments={segments} duration={playerElement.duration}/>,
                shadowProgressBarElement
            )
        }
        {
            videoToolbarElement && playerElement && videoToolbarContainer && bvId && chapterId && userId && createPortal(
                <ReportSegmentModal
                    bvId={bvId}
                    chapterId={chapterId}
                    userId={userId}
                    videoDuration={playerElement.duration}
                    startTime={startTime}
                    endTime={endTime}
                    handleChangeStartTime={(reset=false) => {setStartTime(reset ? 0 : Number(playerElement.currentTime.toFixed(2)))}}
                    handleChangeEndTime={(reset=false) => {setEndTime(reset ? 0 : Number(playerElement.currentTime.toFixed(2)))}}
                    container={videoToolbarContainer}
                    updateSegments={(newSegment: Segment) => setSegments([...segments, newSegment])}
                />,
                videoToolbarContainer
            )
        }
    </>
}

export default SkipSegment