import { createWorker } from "tesseract.js"

/**
 * Executes OCR on an image file buffer.
 * Uses require.resolve to reliably locate the absolute workerPath in both local dev and serverless environments.
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
                gzip: false,
                errorHandler: (err: any) => console.error("[OCR Worker Error]:", err)
            };

            try {
                const resolvedWorkerPath = require.resolve("tesseract.js/src/worker-script/node/index.js");
                if (resolvedWorkerPath) {
                    options.workerPath = resolvedWorkerPath;
                }
            } catch (resolveErr) {
                console.warn("[OCR] require.resolve for workerPath failed, using default:", resolveErr);
            }

            worker = await createWorker(["heb", "eng"], 1, options);

            await worker.setParameters({
                tessedit_pageseg_mode: "11" as any, // 11 = Sparse text
            });

            const res = await worker.recognize(imageBuffer);
            const text = res?.data?.text || "";
            const confidence = res?.data?.confidence || 70;

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
