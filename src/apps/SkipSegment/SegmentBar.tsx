import type {FC} from "react";
import {Segment} from "../../utils/video.ts";

interface SegmentBarProps {
    isShadow: boolean,
    segments: Segment[],
    duration: number
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

export default SegmentBar