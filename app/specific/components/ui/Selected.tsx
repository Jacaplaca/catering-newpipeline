import { type FC } from 'react';

const Selected: FC<{ element: { id: string, name: string, code: string }, onClick: (a: unknown) => void, isLocked?: boolean }> = ({ element, onClick, isLocked }) => {
    return <div
        onClick={onClick}
        className={`dark:bg-neutral-700/90 bg-neutral-100
    text-neutral-900 dark:text-neutral-100
    ${isLocked ? 'cursor-default' : 'cursor-pointer dark:hover:bg-darkmode-secondary-accent'}
    hover:bg-secondary
rounded-md px-3 py-1 text-sm flex flex-row items-center`}>
        {element.name} <span className='text-xs'>
            <i className='fa-solid fa-circle-small mx-1 dark:text-neutral-800 text-neutral-300' />
            <span className='font-semibold tracking-wider'>{element.code}</span>
        </span>
    </div>
}

export default Selected;