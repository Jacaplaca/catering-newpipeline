import LongText from '@root/app/_components/ui/LongText';
import { useState, type FunctionComponent } from 'react';
import { useCopyToClipboard } from 'usehooks-ts'

const LinkCopy: FunctionComponent<{
    link: string,
    label: string,
}> = ({ link, label }) => {
    const [, copy] = useCopyToClipboard()
    const [showCopied, setShowCopied] = useState(false)
    const copyToClipboard = (url: string) => {
        void copy(url)
        setShowCopied(true)
        setTimeout(() => {
            setShowCopied(false)
        }, 3000)
    }

    return (
        <LongText
            label={label}
            text={link}
            ActionButton={() => (
                showCopied
                    ? <i className="fa-regular fa-check-circle copied-to-clipboard"></i>
                    : <button
                        onClick={() => { copyToClipboard(link) }}
                        className="fa-regular fa-copy copy-button text-neutral-800 dark:text-neutral-100"></button>
            )}
        />
    )
};

export default LinkCopy;