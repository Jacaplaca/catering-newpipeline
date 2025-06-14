import useFilterByTagId from '@root/app/hooks/table/useFilterByTagId';

const useFilter = ({
    lang,
    pageName,
}: {
    lang: LocaleApp
    pageName: string
}) => {
    const tags = useFilterByTagId({ lang, pageName });

    return {
        tags
    };
}

export default useFilter;