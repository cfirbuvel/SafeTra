/**
 * Helper to get the correct site URL dynamically across environments
 * (Localhost, Vercel Preview/Staging, and Production).
 */
export const getURL = () => {
    let url =
        process.env.NEXT_PUBLIC_SITE_URL ?? // Custom domain / production URL if set
        process.env.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel on preview deployments
        "http://localhost:3000/"

    // Ensure http/https protocol is present
    url = url.startsWith("http") ? url : `https://${url}`

    // Ensure trailing slash
    url = url.endsWith("/") ? url : `${url}/`

    return url
}
