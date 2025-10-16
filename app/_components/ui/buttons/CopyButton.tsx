import useCopyToClipboard from '@root/app/hooks/useCopyToClipboard';
import { forwardRef, useImperativeHandle } from 'react';

export interface CopyButtonRef {
    copy: () => void;
}

interface CopyButtonProps {
    content: string;
    isSkeleton?: boolean;
}

const CopyButton = forwardRef<CopyButtonRef, CopyButtonProps>(({ content, isSkeleton = false }, ref) => {
    const { showCopied, copyToClipboard } = useCopyToClipboard();

    // Expose copy method to parent via ref
    useImperativeHandle(ref, () => ({
        copy: () => {
            copyToClipboard(content);
        }
    }));

    if (showCopied) {
        return <i className="fa-regular fa-check-circle copied-to-clipboard"></i>
    }

    return <div className="long-text">

        <button
            onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(content);
            }}
            disabled={isSkeleton}
            className={`
            fa-regular fa-copy copy-button  text-neutral-800 dark:text-neutral-100
            ${isSkeleton ? 'copy-button-skeleton opacity-50 ' : ''}
            `}></button>
    </div>
});

CopyButton.displayName = 'CopyButton';

export default CopyButton;