import {type FC, useEffect, useState} from 'react'
import {getSegments, postSegments, RedundantType, RedundantTypeConfig, redundantTypeConfig, Segment} from "../../utils/video.ts"
import {waitForElement} from "../../utils/host.ts"
import {formatTime} from "../../utils/common.ts"
import {useVideo} from "../../hooks/useVideo.tsx"
import {BvId, ChapterId} from "../../types/global"
import bilibot from "../../assets/bilibot.svg"
import {Form, message, Modal, Radio, Tooltip} from "antd/es";
import FormItem from "antd/es/form/FormItem";
import {createPortal} from "react-dom";
import {useUserId} from "../../hooks/useUserId.ts";
import {getHashBySHA256} from "../../utils/crypto.ts";
import './SkipSegment.css'
import {useForm} from "antd/es/form/Form";

const videoSelectors = [".bpx-player-video-area video", ".bilibili-player video", "video"]
// progress is bar when hovering on video player
const progressBarSelector = '.bpx-player-progress'
// shadow is bar at the bottom of video player
const shadowProgressBarSelector = '.bpx-player-shadow-progress-area'
const notPlayingEvents = ['pause', 'ended', 'waiting', 'seeking', 'stalled', 'suspend', 'emptied']
const videoToolbarRightSelector = '.video-toolbar-right'

interface SegmentBarProps {
    isShadow: boolean,
    segments: Segment[],
    duration: number
}

interface ReportSegmentProps {
    userId: number,
    bvId: BvId,
    chapterId: ChapterId,
    videoDuration: number,
    startTime: number,
    endTime: number,
    handleChangeStartTime: (reset?: boolean) => void,
    handleChangeEndTime: (reset?: boolean) => void,
    container: HTMLDivElement,
}

const getPercentage = (seconds: number, duration = 0, isLeft = true) => {
    if (Math.floor(seconds) > Math.floor(duration)) {
        console.warn(`[BC] video duration for getPercentage is out of range: ${seconds}, ${duration}.`)
        return isLeft ? '100%' : '0%'
    }
    if (duration <= 0) {
        console.error('[BC] video duration for getPercentage 0.')
        return isLeft ? '0%' : '100%'
    }
    return isLeft
        ? `${((Math.max(seconds, 0) / duration) * 100).toFixed(2)}%`
        : `${(((duration - Math.min(seconds, duration)) / duration) * 100).toFixed(2)}%`
}

const reportCategoryOptions = (Object.entries(redundantTypeConfig) as [RedundantType, RedundantTypeConfig][])
                                .filter(entry => {
                                    return ![RedundantType.FULL, RedundantType.UNKNOWN, RedundantType.PADDING].includes(entry[0])
                                })
                                .map(([k, v]) => {
                                    return {
                                        label: (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className='segment-category-label' style={{ backgroundColor: v.color }}/>
                                                <span>{v.name}</span>
                                            </div>
                                        ),
                                        value: k,
                                    }
                                })

const SegmentBar: FC<SegmentBarProps> = (props) => {
    const sortedSegments = props.segments.sort((a, b) => a.start - b.start)
    return <ul id={props.isShadow ? "shadow-segments-bar" : "segments-bar"} className='ul-segment-bar'>
        {
            sortedSegments.map((segment, i) =>
                <li
                    key={i}
                    id={props.isShadow ? 'li-shadow-segment-bar' : 'li-segment-bar'}
                    className='li-segment-bar'
                    segment-category={segment.redundantType}
                    style={{
                        backgroundColor: segment.color,
                        opacity: segment.opacity,
                        // left is percentage to left edge of parent container
                        left: getPercentage(segment.start, props.duration, true),
                        // right is percentage to right edge of parent container
                        right: getPercentage(segment.end, props.duration, false),
                    }}
                />
            )
        }
    </ul>
}

const ReportSegmentModal: FC<ReportSegmentProps> = (props) => {
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [reportForm] = useForm()

    const reset = () => {
        setModalOpen(false)
        props.handleChangeStartTime(true)
        props.handleChangeEndTime(true)
        reportForm.resetFields()
    }
    const reportSegments = async () => {
        if (props.endTime - props.startTime < 10) {
            message.error('片段时长至少10s')
            return
        }
        try {
            setLoading(true)
            const userId = await getHashBySHA256(String(props.userId))
            const result = await postSegments({
                videoID: props.bvId,
                cid: String(props.chapterId),
                userID: userId,
                userAgent: window.navigator.userAgent,
                videoDuration: props.videoDuration,
                segments: [
                    {
                        segment: [props.startTime, props.endTime],
                        actionType: 'skip',
                        category: reportForm.getFieldValue('category') as RedundantType
                    }
                ]
            })
            if (result) {
                console.log(`[BC] reported segment ${props.bvId} ${props.chapterId} ${formatTime(props.startTime)} - ${formatTime(props.endTime)}`)
                message.success('上报片段成功')
                reset()
            } else {
                console.error(`[BC] report segment ${props.bvId} ${props.chapterId} ${formatTime(props.startTime)} - ${formatTime(props.endTime)} failed, returned false`)
                message.error('上报分段失败')
            }
        } catch (e) {
            console.error(`[BC] report segment ${props.bvId} ${props.chapterId} ${formatTime(props.startTime)} - ${formatTime(props.endTime)} failed, ${e}`)
        } finally {
            setLoading(false)
        }

    }

    return <>
        {/* report button */}
        <div
            id='report-segment-button'
            className='report-segment-button'
            onClick={() => {
                if (props.startTime) {
                    props.handleChangeEndTime()
                    setModalOpen(true)
                } else {
                    props.handleChangeStartTime()
                }
            }}
        >
            <img src={bilibot} alt='bilibot' className='report-segment-button-icon'/>
            <Tooltip title={
                <>
                    1.首次点击将当前时间记为片段起点<br/>
                    2.再次点击记录终点并打开弹窗<br/>
                </>
            }>
                <span
                    style={{
                        fontSize: '14px',
                        color: '#00AEEC',
                    }}
                >
                    {
                        props.startTime
                            ? props.endTime
                                ? '记录片段终点'
                                : '记录片段终点'
                            : '记录片段起点'
                    }

                </span>
            </Tooltip>
            <div className='report-segment-button-border'/>
        </div>
        {/* report modal */}
        <Modal
            className='report-segment-modal'
            title='仅支持标记为跳过'
            open={modalOpen}
            closable={false}
            cancelText='重置'
            onCancel={reset}
            cancelButtonProps={{
                loading: loading
            }}
            okText='提交'
            onOk={reportSegments}
            okButtonProps={{
                loading: loading
            }}
            width='20vw'
            mask={{
                closable: false,
                blur: true,
            }}
            getContainer={props.container}
            centered={true}
        >
            <Form
                form={reportForm}
                initialValues={{category: reportCategoryOptions[0].value}}
                style={{
                    paddingTop: '1em'
                }}
            >
                <FormItem
                    label='时间范围'
                >
                    <span>{`${formatTime(props.startTime)} -> ${formatTime(props.endTime)}`}</span>
                </FormItem>
                <FormItem
                    label='片段类型'
                    name='category'
                    required={true}
                    style={{marginBottom: '12px'}}
                >
                    <Radio.Group options={reportCategoryOptions}/>
                </FormItem>
            </Form>
        </Modal>
    </>
}

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
                />,
                videoToolbarContainer
            )
        }
    </>
}

export default SkipSegment