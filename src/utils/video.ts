// there are many format of video urls, like /video/BV1234567890 /BV1234567890 ?bvid=BV1234567890
import api from "./api.ts"
import {globalConfig} from "../config/global.ts"
import {getHashBySHA256} from "./crypto.ts"

export interface Segment {
    segment: number[],       // 起始和结束时间（秒），例如 [0, 15.23]
    cid: string,            // 视频CID
    UUID: string,           // 片段UUID
    category: string,       // 片段类别
    actionType: string,     // 片段动作类型
    locked: number,            // 该提交是否锁定
    votes: number,             // 该片段的投票数
    videoDuration: number,     // 提交时的视频时长，用于判断提交是否过期，未知时为 0，要求误差在 ±2 秒内
}

interface VideoSegments {
    videoID: string,
    segments: Segment[],
}

const bvPattern = /BV[a-zA-Z0-9]{10,12}/i

/**
 * Extract Bilibili video ID from current URL
 * @param {string} url - current page url of video
 * @returns {string|null} Video ID (BVID) or null if not found
 */
export const parseVideoId = (url: string): string => {
    const match = url.match(bvPattern)
    console.log(`[BC] match result is ${match}`)
    return match ? match[0] : ''
}

export const getSegments = async (videoId: string): Promise<Segment[]> => {
    try {
        console.log(`[BC] try to get segments for ${videoId}`)
        if (videoId) {
            const data = await api.get<VideoSegments[]>(`${globalConfig.server}/api/skipSegments/${(await getHashBySHA256(videoId)).slice(0, 4)}`)
            for (const videoSegment of data) {
                if (videoSegment.videoID === videoId) {
                    return videoSegment.segments
                }
            }
            console.log(`[BC] no segments found for video ${videoId} in ${data.length} video segments`)
        }
        return []
    } catch (error) {
        console.error(error)
        return []
    }
}