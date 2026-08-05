import { createWorker } from "tesseract.js"
import path from "path"
import fs from "fs"

/**
 * Executes OCR on an image file buffer.
 * Configures tessdata CDN for Hebrew & English language models and resolves standalone bundled worker script.
 */
export async function runOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    return new Promise(async (resolve) => {
        let worker: any = null;
        let isCompleted = false;

        const timeout = setTimeout(async () => {
            if (!isCompleted) {
                isCompleted = true;
                console.warn("[OCR] Timeout reached (20s). Returning fast response.");
                if (worker) {
                    try { await worker.terminate(); } catch (e) {}
                }
                resolve({ text: "", confidence: 50 });
            }
        }, 20000);

        try {
            const options: any = {
                langPath: "https://tessdata.projectnaptha.com/4.0.0",
                errorHandler: (err: any) => console.error("[OCR Worker Error]:", err)
            };

            // Prefer single-file bundled worker.min.js to prevent relative require('..') failures in serverless
            const distWorkerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "dist", "worker.min.js");
            const nodeWorkerPath = path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js");

            if (fs.existsSync(distWorkerPath)) {
                options.workerPath = distWorkerPath;
            } else if (fs.existsSync(nodeWorkerPath)) {
                options.workerPath = nodeWorkerPath;
            }

            worker = await createWorker(["heb", "eng"], 1, options);

            await worker.setParameters({
                tessedit_pageseg_mode: "11" as any, // 11 = Sparse text
            });

            const res = await worker.recognize(imageBuffer);
            const text = res?.data?.text || "";
            const confidence = Math.round(res?.data?.confidence || 70);

            console.log(`[OCR Success] Recognized ${text.length} characters with ${confidence}% confidence.`);

            if (!isCompleted) {
                isCompleted = true;
                clearTimeout(timeout);
                try { await worker.terminate(); } catch (e) {}
                resolve({ text, confidence });
            }
        } catch (err: any) {
            console.error("Tesseract OCR Execution Exception:", err);
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
