import {useEffect, useRef, useState} from "react";
import {$window} from "../config/global.ts";

export const useUserId = () => {
    const [userId, setUserId] = useState<number>(0)
    const checkTimes = useRef<number>(0)
    useEffect(() => {
        const getUserId = () => {
            // 本地开发时需将unsafeWindow替换成window
            return $window?.__INITIAL_STATE__?.userInfo?.mid || $window?.__INITIAL_STATE__?.user?.mid || 0
        }
        const currentUserId = getUserId()
        if (currentUserId) {
            setUserId(currentUserId)
            return
        }

        const timer = setInterval(() => {
            const newUserId = getUserId()
            if (newUserId) {
                setUserId(newUserId)
                clearInterval(timer)
                console.log(`[BC] user id obtained: ${newUserId}`)
            }
            else {
                checkTimes.current++
                if (checkTimes.current >= 10) {
                    clearInterval(timer)
                    console.warn('[BC] get user id failed after 10s')
                }
            }
        }, 1000)

        return () => {
            clearInterval(timer)
        }
    }, [])

    return userId
}