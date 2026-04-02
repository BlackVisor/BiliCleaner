import {useEffect, useState} from "react";
import {BvId, ChapterId} from "../types/global";
import {$window} from "../config/global.ts";

export const useVideo = () => {
    // videoId is bvid, chapterId is partId (relative to &p=2), so chapterId is the real unique id in player
    const [bvId, setBvId] = useState<BvId>('' as BvId)
    const [chapterId, setChapterId] = useState<ChapterId>(0 as ChapterId)

    useEffect(() => {
        const handleUrlChange = () => {
            // get from window (unsafeWindow), there are other attributes
            const newBvId = ($window?.__INITIAL_STATE__?.bvid || '') as BvId
            const newChapterId = ($window?.__INITIAL_STATE__?.cid || 0) as ChapterId
            setBvId(newBvId)
            setChapterId((prevChapterId) => {
                if (prevChapterId !== newChapterId) console.log(`[BC] video changed to: bvId=${newBvId}, chapterId=${newChapterId}`)
                return newChapterId
            })
        }
        // execute once when loaded
        handleUrlChange()

        const _pushState = history.pushState
        history.pushState = function (...args) {
            _pushState.apply(history, args)
            handleUrlChange()
        }

        const _replaceState = history.replaceState
        history.replaceState = function (...args) {
            _replaceState.apply(history, args)
            handleUrlChange()
        }
        $window.addEventListener('pushState', handleUrlChange);

        return () => {
            $window.removeEventListener('popstate', handleUrlChange);
            history.pushState = _pushState
            history.replaceState = _replaceState
        }
    }, [])

    // videoId means bvid
    // videoId and chapterId is necessary, aId is for compatible of old video
    return { bvId, chapterId }
}