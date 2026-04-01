// there are many format of video urls, like /video/BV1234567890 /BV1234567890 ?bvid=BV1234567890
import api from "./api.ts"
import {globalConfig} from "../config/global.ts"
import {getHashBySHA256} from "./crypto.ts"
import {BvId, ChapterId} from "../types/global";

interface SegmentResponse {
    segment: number[],       // 起始和结束时间（秒），例如 [0, 15.23]
    cid: string,            // chapterId, 这个才是真实的视频 id
    UUID: string,           // 片段UUID
    category: string,       // 片段类别
    actionType: string,     // 片段动作类型
    locked: number,            // 该提交是否锁定，高级用户操作为locked后可防止低级用户的操作污染
    votes: number,             // 该片段的投票数, 越高则表示共识程度越高
    videoDuration: number,     // 提交时的视频时长，用于判断提交是否过期，未知时为 0，要求误差在 ±2 秒内
}

interface VideoSegments {
    videoID: string,
    segments: SegmentResponse[],
}

export interface RedundantTypeConfig {
    color: string,
    skip: boolean,
    opacity: number,
    name: string
}

interface SegmentRequest {
    videoID: string,       // 视频BVID
    cid: string,           // chapterId, 这个才是真实的视频 id, 上报接口要求必须要string类型!
    userID: string,        // 私人用户ID
    userAgent: string,     // 发起请求的客户端和版本，例如 "Chromium/1.0.0"
    videoDuration: number,  // 视频时长，用于判断视频是否经过换源
    segments: {
        segment: number[],   // 起始和结束时间（秒），例如 [0, 15.23]
        category: string,   // 片段类别
        actionType: string  // 片段动作类型
    }[]
}

interface PostSegmentsResponse {
    UUID: string,      // 新片段的UUID
    category: string,  // 片段类别
    segment: number[], // start起始和结束时间（秒）
}

export enum RedundantType {
    // advertisement
    SPONSOR = 'sponsor',
    // like sponsor
    PADDING = 'padding',
    // promote up himself
    PROMOTION = 'selfpromo',
    // ask for san lian
    INTERACTION = 'interaction',
    // some meaningless content, usually at the beginning
    BEGINNING = 'intro',
    // some content so say goodbye, usually at the ending
    ENDING = 'outro',
    PREVIEW = 'preview',
    // only music segment
    MUSIC = 'music_offtopic',
    // fill empty content to increate bitrate
    FILLER = 'filler',
    // most of video is sponsor or promotion
    FULL = "exclusive_access",
    // point of interest
    POI = 'poi_highlight',
    UNKNOWN = 'unknown',
}

enum ActionType {
    SKIP = 'skip',
    MUTE = 'mute',
    FULL = 'full',
    POI = 'poi',
}

const getRedundantType = (category: string) => {
    switch (category) {
        case 'sponsor':
            return RedundantType.SPONSOR
        case 'selfpromo':
            return RedundantType.PROMOTION
        case 'exclusive_access':
            return RedundantType.FULL
        case 'interaction':
            return RedundantType.INTERACTION
        case 'poi_highlight':
            return RedundantType.POI
        case 'intro':
            return RedundantType.BEGINNING
        case 'outro':
            return RedundantType.ENDING
        case 'preview':
            return RedundantType.PREVIEW
        case 'padding':
            return RedundantType.PADDING
        case 'filler':
            return RedundantType.FILLER
        case 'music_offtopic':
            return RedundantType.MUSIC
        default:
            return RedundantType.UNKNOWN
    }
}

export const redundantTypeConfig: Record<RedundantType, RedundantTypeConfig> = {
    [RedundantType.SPONSOR]: {color: '#00d400', skip: true, opacity: 0.7, name: '广告'},
    [RedundantType.PADDING]: {color: '#00d400', skip: true, opacity: 0.7, name: '广告'},
    [RedundantType.PROMOTION]: {color: '#ffff00', skip: true, opacity: 0.7, name: '推广'},
    [RedundantType.INTERACTION]: {color: '#cc00ff', skip: false, opacity: 0.7, name: '互动'},
    [RedundantType.BEGINNING]: {color: '#00ffff', skip: false, opacity: 0.7, name: '开场'},
    [RedundantType.ENDING]: {color: '#0202ed', skip: false, opacity: 0.7, name: '结尾'},
    [RedundantType.PREVIEW]: {color: '#008fd6', skip: false, opacity: 0.7, name: '预览'},
    [RedundantType.MUSIC]: {color: '#ff9900', skip: true, opacity: 0.7, name: '音乐'},
    [RedundantType.FILLER]: {color: '#7300FF', skip: true, opacity: 0.7, name: '后黑'},
    [RedundantType.FULL]: {color: '#008a5c', skip: false, opacity: 0.7, name: '全广'},
    [RedundantType.POI]: {color: '#ff1684', skip: false, opacity: 0.7, name: '精彩时刻'},
    [RedundantType.UNKNOWN]: {color: '#ffffff', skip: false, opacity: 0, name: '未知'}
}

export interface Segment {
    start: number,
    end: number,
    color: string,
    redundantType: RedundantType,
    skip: boolean,
    opacity: number
}

const assembleSegment = (segments: SegmentResponse[], chapterId: ChapterId): Segment[] => {
    const validVideoSegments = segments
        .filter(
            // startTime and endTime are necessary, duration >= 3s
            x => x.segment.length === 2
            && x.segment[1] - x.segment[0] >= 3
            // chapterId matched
            && x.cid === String(chapterId)
            // actionType matched, only support skip now
            && x.actionType === ActionType.SKIP
            && x.votes >= 0
            // TODO check locked
        )
        .sort((a, b) => a.segment[0] !== b.segment[0] ? a.segment[0] - b.segment[0] : a.segment[1] - b.segment[1])
    const mergedSegmentsResponse: SegmentResponse[] = []
    validVideoSegments.forEach(x => {
        let replaced = false
        let redundant = false
        mergedSegmentsResponse.forEach(y => {
            if (y.segment[0] <= x.segment[0] && y.segment[1] >= x.segment[1]) {
                // replace with shorter x, no need to push into result
                y.segment = [...x.segment]
                replaced = true
            } else if (y.segment[0] < x.segment[0] && y.segment[1] > x.segment[1]) {
                // y is longer, no need to process
                redundant = true
            }
        })
        if (!replaced && !redundant) mergedSegmentsResponse.push(x)
    })
    return mergedSegmentsResponse.map(x => {
        const [start, end] = x.segment
        const redundantType = getRedundantType(x.category)
        return {
            start: start,
            end: end,
            color: redundantTypeConfig[redundantType].color,
            skip: redundantTypeConfig[redundantType].skip,
            redundantType: redundantType,
            opacity: redundantTypeConfig[redundantType].opacity,
        }
    })
}

/**
 * @param bvId string that start with BV
 * @param chapterId number
 * @return Promise<Segment[]> segments matched with this video id, and segment length must be start, end, and end - start >= 3s
 */
export const getSegments = async (bvId: BvId, chapterId: ChapterId): Promise<Segment[]> => {
    try {
        console.log(`[BC] try to get segments for ${bvId} ${chapterId}`)
        if (bvId && chapterId) {
            const data = await api.get<VideoSegments[]>(`${globalConfig.server}/api/skipSegments/${(await getHashBySHA256(bvId)).slice(0, 4)}`)
            for (const videoSegment of data) {
                if (videoSegment.videoID === bvId) {
                    // merge segments that have interaction, and convert to active segments
                    return assembleSegment(videoSegment.segments, chapterId)
                }
            }
            console.log(`[BC] no segments found for bvId=${bvId} chapterId=${chapterId} in ${data.length} video segments`)
        }
        return []
    } catch (error) {
        console.error(error)
        return []
    }
}

export const postSegments = async (segmentRequest: SegmentRequest) => {
    try {
        const r = await api.post<PostSegmentsResponse[]>(
            `${globalConfig.server}/api/skipSegments`,
            undefined,
            segmentRequest,
            undefined,
        )
        if (r.length) {
            // console.log(`[BC] post segment done, first uuid is ${r[0].UUID}`)
            return true
        } else {
            console.error(`[BC] post segment failed, response is empty`)
            return false
        }
    } catch (error) {
        console.error(error)
        return false
    }
}