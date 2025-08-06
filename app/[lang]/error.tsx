'use client' // Error components must be Client Components

import translate from '@root/app/lib/lang/translate';
import getMainPageUrl from '@root/app/lib/url/getMainPageUrl';
import { api } from '@root/app/trpc/react';
import { useLang } from 'app/contexts/LangContext';
import Link from 'next/link';

export default function Error({
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const lang = useLang();

    const { data: dict } = api.translation.getLangGroup.useQuery({ lang, keys: ['error'] }, {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
    })

    if (!dict) return null

    const errorData = {
        icon: '🛠️',
        message: translate(dict, "error:DEFAULT"),
        url: getMainPageUrl(lang)
    }

    return (
        <section className="section pt-7 flex flex-col items-center gap-4 w-full justify-center">
            <div className="container ">
                <h4 className="flex flex-col items-center gap-6">
                    <span className="text-6xl">{errorData.icon}</span>
                    <Link
                        className="font-bold text-2xl opacity-90 hover:opacity-100 transition-opacity duration-300"
                        href={errorData.url}>{errorData.message}</Link>
                </h4>
            </div>
        </section>
    )
}