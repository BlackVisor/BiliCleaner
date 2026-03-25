const encoder = new TextEncoder()

export const getHashBySHA256 = async (value: string) => {
    try {
        // Check if crypto.subtle is available (required for hash functions)
        if (!crypto || !crypto.subtle) {
            console.error("[BC] crypto.subtle is not available. Hash functions will not work.")
            return value // Fallback to original value
        }
        return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value))))
            .map(b => b.toString(16).padStart(2, "0")).join("")
    } catch (error) {
        console.error("[BC] error when hashing value:", error)
        return value // Fallback to original value
    }
}