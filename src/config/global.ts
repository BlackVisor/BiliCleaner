import { unsafeWindow } from "$";

// in dev, can user window to get host context, in prod, need unsafeWindow
export const $window = import.meta.env.DEV ? window : unsafeWindow

export const globalConfig = {
    // domain is always block by CFW, so use ip directly, used domain is www.bsbsb.top.
    // below server ip is from https://github.com/hanydd/BilibiliSponsorBlock/issues/267
    server: 'https://154.222.28.109',
    // fixed headers from https://github.com/hanydd/BilibiliSponsorBlock/wiki/API
    headers: {
        'origin': 'chrome-extension://eaoelafamejbnggahofapllmfhlhajdd',
        'x-ext-version': '0.5.0'
    }
}