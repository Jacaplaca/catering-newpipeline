import archiver from 'archiver';

type SinglePdfInput = Promise<{
    pdfPromise: Promise<Buffer<ArrayBufferLike>>;
    fileName: string;
}>;

type MultiplePdfInput = {
    pdfPromises: Promise<Array<{ fileName: string; pdfPromise: Promise<Buffer<ArrayBufferLike>> }>>;
    fileName: string;
};

const returnPdfForFront = async (input: SinglePdfInput | MultiplePdfInput) => {
    // Check if we're dealing with multiple PDFs (MultiplePdfInput is an object with pdfPromises)
    if (typeof input === 'object' && input !== null && 'pdfPromises' in input) {
        // Create ZIP file
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        const chunks: Buffer[] = [];

        // Create promise for ZIP generation (similar to PDFKit pattern)
        const zipPromise = new Promise<Buffer>((resolve, reject) => {
            // Collect stream data
            archive.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            // Resolve when archive is finalized
            archive.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            // Handle errors
            archive.on('error', reject);
        });

        // Wait for all PDF promises to resolve
        const pdfs = await Promise.all(
            (await input.pdfPromises).map(async ({ fileName, pdfPromise }) => ({
                fileName,
                buffer: await pdfPromise
            }))
        );

        // Add each PDF to the archive
        pdfs.forEach(({ fileName, buffer }) => {
            archive.append(buffer, { name: fileName });
        });

        // Finalize the archive (this will trigger 'end' event when done)
        await archive.finalize();

        // Wait for ZIP to be fully generated
        const zipBuffer = await zipPromise;
        const base64Zip = zipBuffer.toString('base64');

        return {
            base64Pdf: base64Zip,
            contentType: 'application/zip',
            fileName: input.fileName
        };
    } else {
        // Single PDF - input is a Promise that resolves to { pdfPromise, fileName }
        const { pdfPromise, fileName } = await input;
        const pdfBuffer = await pdfPromise;
        const base64Pdf = pdfBuffer.toString('base64');

        return {
            base64Pdf,
            contentType: 'application/pdf',
            fileName
        };
    }
};

export default returnPdfForFront;
