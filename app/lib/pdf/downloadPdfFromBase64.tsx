function downloadPdfFromBase64(pdfData: {
    base64Pdf: string,
    contentType: string,
    fileName: string,
}) {
    // Decode base64 string to binary data
    const { base64Pdf, contentType, fileName } = pdfData;
    const byteCharacters = atob(base64Pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Create blob and object URL for download
    const blob = new Blob([byteArray], { type: contentType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

export default downloadPdfFromBase64;