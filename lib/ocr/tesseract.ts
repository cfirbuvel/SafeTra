import { createWorker } from "tesseract.js"

/**
 * Executes OCR on an image file buffer (Server Side).
 * Delegates processing to client-side WASM engine when running in Vercel serverless environments.
 */
export async function runOCR(imageBuffer: Buffer): Promise<{ text: string; confidence: number }> {
    return new Promise(async (resolve) => {
        // In Vercel serverless lambdas, delegate OCR to browser WASM engine to prevent worker thread errors & log warnings
        if (process.env.VERCEL) {
            console.log("[Server OCR] Vercel environment detected. Delegating document parsing to client WASM engine.");
            resolve({ text: "", confidence: 0 });
            return;
        }

        let worker: any = null;
        let isCompleted = false;

        const timeout = setTimeout(async () => {
            if (!isCompleted) {
                isCompleted = true;
                console.warn("[Server OCR] Timeout reached (15s). Returning fallback.");
                if (worker) {
                    try { await worker.terminate(); } catch (e) {}
                }
                resolve({ text: "", confidence: 0 });
            }
        }, 15000);

        try {
            const options: any = {
                langPath: "https://tessdata.projectnaptha.com/4.0.0",
                errorHandler: (err: any) => console.error("[Server OCR Worker Error]:", err)
            };

            worker = await createWorker("heb+eng", 1, options);

            await worker.setParameters({
                tessedit_pageseg_mode: "11" as any,
            });

            const res = await worker.recognize(imageBuffer);
            const text = res?.data?.text || "";
            const confidence = Math.round(res?.data?.confidence || 70);

            if (!isCompleted) {
                isCompleted = true;
                clearTimeout(timeout);
                try { await worker.terminate(); } catch (e) {}
                resolve({ text, confidence });
            }
        } catch (err: any) {
            console.error("Server Tesseract OCR Exception:", err);
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
