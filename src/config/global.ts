import { unsafeWindow } from "$";

// in dev, can user window to get host context, in prod, need unsafeWindow
export const $window = import.meta.env.DEV ? window : unsafeWindow

export const globalConfig = {
    server: 'https://www.bsbsb.top',
    // fixed headers from https://github.com/hanydd/BilibiliSponsorBlock/wiki/API
    headers: {
        'origin': 'chrome-extension://eaoelafamejbnggahofapllmfhlhajdd',
        'x-ext-version': '0.5.0'
    }
}