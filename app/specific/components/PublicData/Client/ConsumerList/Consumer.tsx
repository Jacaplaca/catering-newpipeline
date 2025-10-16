import { useRef, type FC } from 'react';
import makeHref from '@root/app/lib/url/makeHref';
import CopyButton, { type CopyButtonRef } from '@root/app/_components/ui/buttons/CopyButton';

const Consumer: FC<{ id: string, code: string, loading?: boolean, lang: LocaleApp }> = ({ id, code, loading = false, lang }) => {
    const href = makeHref({ lang, page: 'menu', slugs: [id] }, true)

    const copyRef = useRef<CopyButtonRef>(null);

    const handleExternalClick = () => {
        copyRef.current?.copy();
    };

    if (loading) {
        return <div
            key={id}
            className="w-full relative overflow-hidden rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:bg-neutral-800 dark:border-neutral-700 animate-pulse"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-4 w-4 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                    <div className="h-4 w-24 bg-neutral-300 dark:bg-neutral-600 rounded"></div>
                </div>
                <CopyButton content={href} ref={copyRef} isSkeleton={true} />
            </div>
        </div>
    }

    return <div
        onClick={handleExternalClick}
        key={id}
        className="group relative overflow-hidden rounded-lg cursor-pointer border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md  dark:bg-neutral-800 dark:border-neutral-700"
    >
        <div className="">
            <div className="flex items-center w-full justify-between gap-3">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-user text-neutral-600 dark:text-neutral-400"></i>
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {code}
                    </div>
                </div>
                <CopyButton content={href} ref={copyRef} />
            </div>
        </div>
    </div>
}

export default Consumer;