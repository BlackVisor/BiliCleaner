import {GM_xmlhttpRequest} from "$"

/**
 * 通用请求配置（可全局配置）
 */
interface RequestConfig {
    timeout?: number // 超时时间（毫秒）
    headers?: Record<string, string> // 全局请求头
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document' // 默认 json
    anonymous?: boolean // 是否匿名请求
}

/**
 * API 封装类
 */
class TamperMonkeyApi {
    // 全局默认配置
    private defaultConfig: RequestConfig = {
        timeout: 10000,
        headers: {
            'Content-Type': 'application/json charset=utf-8',
        },
        responseType: 'json',
        anonymous: true,
    }

    constructor(config?: RequestConfig) {
        // 合并自定义默认配置
        this.defaultConfig = {...this.defaultConfig, ...config}
    }

    /**
     * 拼接 URL 参数
     * @param url 基础 URL
     * @param params URL 参数对象
     * @returns 拼接后的 URL
     */
    private buildUrl(url: string, params?: Record<string, string | undefined | null>): string {
        if (!params || Object.keys(params).length === 0) return url

        const searchParams = new URLSearchParams()
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value))
            }
        })
        return `${url}?${searchParams.toString()}`
    }

    /**
     * 核心请求方法
     * @param method HTTP 方法
     * @param url 请求地址
     * @param params URL 参数
     * @param body 请求体
     * @param config 自定义配置
     * @returns Promise<T>
     */
    private request<T = unknown, U = unknown>(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        params?: Record<string, string | undefined | null>,
        body?: U,
        config?: RequestConfig
    ): Promise<T> {
        // 合并配置
        const finalConfig = {...this.defaultConfig, ...config}
        // 拼接 URL 参数
        const finalUrl = this.buildUrl(url, params)

        return new Promise((resolve, reject) => {
            // 发起 GM 请求
            GM_xmlhttpRequest({
                method,
                url: finalUrl,
                headers: finalConfig.headers,
                data: body ? JSON.stringify(body) : undefined,
                responseType: finalConfig.responseType,
                timeout: finalConfig.timeout,
                anonymous: finalConfig.anonymous,
                fetch: true,
                onload: (response) => {
                    // 处理 HTTP 错误（状态码非 2xx）
                    console.log(`[BC] fetching ${method} ${finalUrl}, response status: ${response.status}`)
                    if (!response.status.toString().startsWith('2')) {
                        return reject(new Error(`Request failed with status ${response.status}: ${response.statusText}`))
                    }
                    // 根据 responseType 返回对应数据
                    resolve(response.response as T)
                },
                onerror: (error) => {
                    reject(new Error(`[BC] fetch error: code is ${error.status}, error is ${error.error}`))
                },
                ontimeout: () => {
                    reject(new Error(`[BC] fetch timeout (${finalConfig.timeout}ms)`))
                },
                onabort: () => {
                    reject(new Error('[BC] fetch aborted'))
                },
            })
        })
    }

    /**
     * GET 请求
     * @param url 请求地址
     * @param params URL 参数
     * @param config 自定义配置
     * @returns Promise<T>
     */
    get<T = unknown>(url: string, params?: Record<string, string | undefined | null>, config?: RequestConfig): Promise<T> {
        return this.request<T>('GET', url, params, undefined, config)
    }

    /**
     * POST 请求
     * @param url 请求地址
     * @param params URL 参数
     * @param body 请求体（JSON/FormData）
     * @param config 自定义配置
     * @returns Promise<T>
     */
    post<T = unknown, U = unknown>(
        url: string,
        params?: Record<string, string | undefined | null>,
        body?: U,
        config?: RequestConfig
    ): Promise<T> {
        return this.request<T>('POST', url, params, body, config)
    }

    /**
     * PUT 请求
     * @param url 请求地址
     * @param params URL 参数
     * @param body 请求体（JSON/FormData）
     * @param config 自定义配置
     * @returns Promise<T>
     */
    put<T = unknown, U = unknown>(
        url: string,
        params?: Record<string, string | undefined | null>,
        body?: U,
        config?: RequestConfig
    ): Promise<T> {
        return this.request<T>('PUT', url, params, body, config)
    }

    /**
     * DELETE 请求
     * @param url 请求地址
     * @param params URL 参数
     * @param body 请求体（JSON/FormData）
     * @param config 自定义配置
     * @returns Promise<T>
     */
    delete<T = unknown, U = unknown>(
        url: string,
        params?: Record<string, string | undefined | null>,
        body?: U,
        config?: RequestConfig
    ): Promise<T> {
        return this.request<T>('DELETE', url, params, body, config)
    }

    /**
     * 更新全局默认配置
     * @param config 新的默认配置
     */
    updateDefaultConfig(config: RequestConfig): void {
        this.defaultConfig = {...this.defaultConfig, ...config}
    }
}

// 实例化 API（导出供全局使用）
const api = new TamperMonkeyApi()

// 示例：自定义全局配置（可选）
// api.updateDefaultConfig({
//   timeout: 15000,
//   headers: {
//     'Authorization': 'Bearer token123',
//   },
// })

export default api