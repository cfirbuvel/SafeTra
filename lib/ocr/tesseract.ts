import { createWorker } from "tesseract.js"
import path from "path"

/**
 * Executes OCR on a file buffer using Tesseract.js.
 * Supports Hebrew and English.
 */
export async function runOCR(imageBuffer: Buffer) {
    // Explicitly resolve the worker path to avoid Next.js resolution issues
    // Note: Adjusting the path based on the error received
    const workerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js")

    // createWorker arguments depend on version, adding options to fix the path
    const worker = await createWorker(["heb", "eng"], 1, {
        workerPath: workerPath,
        logger: m => console.log(`[OCR] ${m.status}: ${Math.round(m.progress * 100)}%`)
    })

    try {
        const { data: { text, confidence } } = await worker.recognize(imageBuffer)
        return { text, confidence }
    } finally {
        await worker.terminate()
    }
}
