import {FC, useEffect} from "react";
import {useVideo} from "../hooks/useVideo.tsx";
import {waitForElement} from "../utils/host.ts";

const playRateSelector = '.bpx-player-ctrl-playbackrate-result'
const playRateMenuItem = 'bpx-player-ctrl-playbackrate-menu-item'
export const MorePlayRate: FC = () => {
    const { chapterId } = useVideo()
    useEffect(() => {
        if (!chapterId) return
        waitForElement([playRateSelector], HTMLDivElement)
            .then(() => {
                const playRateItems = document.getElementsByClassName(playRateMenuItem) as HTMLCollectionOf<HTMLElement>
                console.log('[3x play] get playrate options length: ' + playRateItems.length)
                for (const playRate of playRateItems) {
                    if (playRate.getAttribute('data-value') === '0.75') {
                        playRate.setAttribute('data-value', '3')
                        playRate.innerText = '3.0x'
                        console.log('[3x play] set 3x playrate successfully')
                        return
                    }
                }
                console.log('[3x play] 0.75 playrate not found')
            })
            .catch(reason => console.error(reason))
    }, [chapterId])

    return <></>
}