import { env } from '@root/app/env';
import translatePageName from '@root/app/lib/url/translatePageName';
import { type Locale, i18n } from '@root/i18n-config';

const makeHref = ({
    lang = env.NEXT_PUBLIC_DEFAULT_LOCALE,
    page,
    slugs,
    params
}: {
    lang?: Locale,
    page?: string,
    slugs?: string[],
    params?: URLSearchParams
}, withDomain?: boolean) => {
    const isLangDefault = lang === env.NEXT_PUBLIC_DEFAULT_LOCALE;
    const isOneLang = i18n.locales.length === 1;
    // this occur when the lang is the default lang, especially when we have only one lang
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    let href = isLangDefault || isOneLang ? "" : `/${lang}`;
    const addDomain = (url: string) => {
        // const domain = getBaseUrl();
        return withDomain ? `${env.NEXT_PUBLIC_DOMAIN}${url}` : url
    };
    const addParams = (url: string) => {
        if (!params) {
            return url;
        }
        return `${url}?${params.toString()}`
    };
    if (!page) {
        return addParams(addDomain(href))
    }
    const pageName = translatePageName(i18n.appStructureLocale, lang, page ?? "");
    href = href + `/${pageName}`;
    if (!slugs?.length) {
        return addParams(addDomain(href))
    }
    const slugsJoined = slugs.join("/");
    href = href + `/${slugsJoined}`;
    return addParams(addDomain(href))
};

export default makeHref;