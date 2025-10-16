import { useState } from 'react';
import { useCopyToClipboard as useCopyToClipboardHook } from 'usehooks-ts'

const useCopyToClipboard = () => {
    const [, copy] = useCopyToClipboardHook()
    const [showCopied, setShowCopied] = useState(false)
    const copyToClipboard = (url: string) => {
        void copy(url)
        setShowCopied(true)
        setTimeout(() => {
            setShowCopied(false)
        }, 3000)
    }

    return {
        showCopied,
        copyToClipboard,
    }
}

export default useCopyToClipboard;