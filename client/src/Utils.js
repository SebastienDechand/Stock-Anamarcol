export const dateParser = (num) => {
    let options = {hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "long", year: "numeric", month: "short", day: "numeric"}
    let timestamp = Date.parse(num)
    let date = new Date(timestamp).toLocaleDateString('fr-FR', options)

    return date.toString()
}
export const uploadErrors = (err, detectedMimeType, fileName) => {
    let errors = { format: '', maxSize: '' };

    if (err.message.includes('Invalid file')) {
        const detectedMimeMessage = detectedMimeType ? `Detected MIME type: ${detectedMimeType}.` : '';
        errors.format = `Format incompatible. ${detectedMimeMessage} `;
    }

    if (err.message.includes('Max size')) {
        errors.maxSize = 'Le fichier est trop volumineux, maximum 2.5Mo';
    }

    console.error('Detected MIME Type:', detectedMimeType);
    console.error('File Name:', fileName);

    return errors;
};