const findElement = (selectors: string[]) => {
    let target: HTMLElement | null = null;
    for (const selector of selectors) {
        target = document.querySelector(selector)
        if (target) break
    }
    return target
}

// 该方法参考自https://stackoverflow.com/questions/5525071/how-to-wait-until-an-element-exists
export const waitForElement = <T extends HTMLElement>(selectors: string[], klass: new () => T, timeout = 10000) => {
    return new Promise<T>((resolve, reject) => {
        let targetElement = findElement(selectors)
        if (targetElement) {
            return targetElement instanceof klass ? resolve(targetElement) : reject(new Error(`element "${selectors}" found, but type is ${typeof targetElement}`))
        }

        const timer = setTimeout(() => {
            observer.disconnect()
            reject(new Error(`[BC] mutation observer timeout ${timeout}ms for any selector in ${selectors.join(',')}`))
        }, timeout)

        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length) {
                    targetElement = findElement(selectors)
                    if (targetElement) {
                        clearTimeout(timer)
                        observer.disconnect()
                        return targetElement instanceof klass ? resolve(targetElement) : reject(new Error(`element "${selectors}" found, but type is ${typeof targetElement}`))
                    }
                }
            }
        })
        // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    })
}
