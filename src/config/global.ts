import { unsafeWindow } from "$";

// in dev, can user window to get host context, in prod, need unsafeWindow
export const $window = import.meta.env.DEV ? window : unsafeWindow

export const globalConfig = {
    // using ip 154.222.28.109 will have ERR_CERT_COMMON_NAME_INVALID issue.
    // this ip is from https://github.com/hanydd/BilibiliSponsorBlock/issues/267, if some domain is blocked, try to find other in this issue
    server: 'https://www.bsbsb.top',
    // fixed headers from https://github.com/hanydd/BilibiliSponsorBlock/wiki/API
    headers: {
        'origin': 'chrome-extension://eaoelafamejbnggahofapllmfhlhajdd',
        'x-ext-version': '0.5.0'
    }
}