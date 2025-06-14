import HighlightText from '@root/app/_components/Table/HighlightText';
import { type FunctionComponent } from 'react';

const FoundResults: FunctionComponent<{ clearValue?: () => void, value: string, limit?: number }>
    = ({ clearValue, value, limit = 25 }) => {
        return (
            <HighlightText
                limit={limit}
                onClick={clearValue}
                className={`text-base px-2 py-[4px] rounded-md ml-2
                            font-semibold
                            text-neutral-700 dark:text-white
                            bg-secondary dark:bg-darkmode-secondary
                            ${clearValue ? 'cursor-pointer' : 'pointer-events-none'}
                            `} text={value}
            />
        )
    }

export default FoundResults;