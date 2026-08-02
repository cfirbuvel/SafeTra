import { createWorker } from "tesseract.js"
import path from "path"

/**
 * Executes OCR on an image file buffer.
 * Uses physical disk path for workerPath to ensure compatibility with Next.js bundling on Windows.
 */
export async function runOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    return new Promise(async (resolve) => {
        let worker: any = null;
        let isCompleted = false;

        const timeout = setTimeout(async () => {
            if (!isCompleted) {
                isCompleted = true;
                console.warn("[OCR] Timeout reached (6s). Returning fast response.");
                if (worker) {
                    try { await worker.terminate(); } catch (e) {}
                }
                resolve({ text: "", confidence: 50 });
            }
        }, 6000);

        try {
            const langPath = process.cwd()
            const workerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js")

            worker = await createWorker(["heb", "eng"], 1, {
                workerPath: workerPath,
                langPath: langPath,
                gzip: false,
                errorHandler: (err: any) => console.error("[OCR Worker Error]:", err)
            })

            await worker.setParameters({
                tessedit_pageseg_mode: "3" as any,
            })

            const res = await worker.recognize(imageBuffer)
            const text = res?.data?.text || ""
            const confidence = res?.data?.confidence || 70

            if (!isCompleted) {
                isCompleted = true;
                clearTimeout(timeout);
                try { await worker.terminate(); } catch (e) {}
                resolve({ text, confidence });
            }
        } catch (err: any) {
            console.error("Tesseract OCR Execution Exception:", err)
            if (!isCompleted) {
                isCompleted = true;
                clearTimeout(timeout);
                if (worker) {
                    try { await worker.terminate(); } catch (e) {}
                }
                resolve({ text: "", confidence: 0 });
            }
        }
    });
}
