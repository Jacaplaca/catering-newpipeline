'use client';
import { type FunctionComponent, useEffect, useState } from "react";
import { useDropzone } from 'react-dropzone';
import FileList from '../../_components/form/FileList';
import useUpload, { type FileAndAttachment } from '@root/app/hooks/useUpload';
import getCurrentTime from '@root/app/lib/date/getCurrentTime';

const Drop: FunctionComponent<{
    lang: LocaleApp;
}> = () => {

    const [prefix,] = useState<string>("some-prefix");
    const [, setUploadCompleted] = useState<string>("");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onUploadComplete = ({ key, fileName }: { key: string, fileName: string }) => {
        setUploadCompleted(key);
    };

    const {
        previewAttachments,
        totalSize,
        // progress,
        uploading,
        uploadComplete,
        onSubmit,
        onFileRemove,
        totalLoaded,
        totalProgressPercent,
        setPreviewAttachments
    } = useUpload(prefix, onUploadComplete);



    const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject, acceptedFiles } = useDropzone();

    useEffect(() => {
        const files = acceptedFiles.reduce((acc, file) => {
            const { name, size } = file;
            acc[name] = {
                file,
                attachment: {
                    id: '',
                    postId: '',
                    fileId: '',
                    createdAt: getCurrentTime(),
                    file: {
                        id: '',
                        url: '',
                        type: '',
                        mime: '',
                        name: '',
                        extension: '',
                        size,
                        height: null,
                        width: null,
                        createdAt: getCurrentTime(),
                    },
                },
            };

            return acc;
        }, {} as Record<string, FileAndAttachment>);

        setPreviewAttachments(files);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acceptedFiles]);

    // const removeFile = (fileName: string) => {
    //     setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    // };

    // const removeAll = () => {
    //     setFiles([]);
    // };

    return (
        <section className="container">
            <div {...getRootProps({
                className: `
        flex flex-col items-center p-5 gap-2 cursor-pointer
        border-2 border-dashed rounded
        bg-neutral-100 text-neutral-400
        dark:bg-neutral-800 dark:text-neutral-300
        outline-none transition-colors duration-300
        ${isFocused ? 'border-blue-500' : 'border-neutral-200 dark:border-neutral-600'}
        ${isDragAccept ? 'border-green-500' : ''}
        ${isDragReject ? 'border-red-500' : ''}
    ` })}>
                <input {...getInputProps()} />
                <i className={`fa-solid fa-cloud-arrow-up text-neutral-400 dark:text-neutral-300 text-4xl`} />
                <span className="text-center max-w-[250px]">
                    Przeciągnij i upuść pliki tutaj lub kliknij, aby wybrać pliki</span>
            </div>
            <FileList
                files={Object.values(previewAttachments).map(fa => fa.file)}
                removeFile={onFileRemove}
                removeAll={() => setPreviewAttachments({})}
            />
            {Object.keys(previewAttachments).length > 0 && (
                <button onClick={onSubmit} disabled={uploading}>
                    {uploading ? 'Przesyłanie...' : 'Prześlij pliki'}
                </button>
            )}
            {uploading && (
                <div>
                    Postęp: {totalProgressPercent.toFixed(2)}%
                    ({totalLoaded} / {totalSize} bajtów)
                </div>
            )}
            {uploadComplete && <div>Przesyłanie zakończone!</div>}
        </section>
    );
};

export default Drop;
