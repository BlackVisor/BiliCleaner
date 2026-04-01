export type BvId = string & { _unique: never}
export type AId = number & { _unique: never }
export type ChapterId = number & { _unique: never }

declare global {
    interface Window {
        SB: typeof SBObject
        __INITIAL_STATE__?: {
            bvid?: BvId
            aid?: AId
            cid?: ChapterId,
            // in watch later list, user id is in userInfo
            userInfo?: {
                mid?: number
            },
            // in common page, user id is in user
            user?: {
                mid?: number
            }
        }
    }
}

export {}