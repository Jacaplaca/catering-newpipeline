'use client';
import Pagination from '@root/app/_components/ui/Pagination';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import Consumer from '@root/app/specific/components/PublicData/Client/ConsumerList/Consumer';
import useFetchConsumersPublicData from '@root/app/specific/components/PublicData/Client/ConsumerList/useFetchConsumersPublicData';

const ConsumerList = ({ clientId, lang, dictionary }: { clientId: string, lang: LocaleApp, dictionary: Record<string, string> }) => {
    const { data: { fetchedRows, totalCount, isFetching }, pagination: { page, limit, updatePage, updateLimit } } = useFetchConsumersPublicData({ clientId });

    const rows = isFetching ? Array.from({ length: 10 }).map((_, index) => ({ id: index.toString(), code: 'Loading...' })) : fetchedRows;

    return (
        <div className="w-full space-y-6 p-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {translate(dictionary, "public-profile:consumer_menu_links_title")}
            </h2>
            <p className="text-neutral-700 dark:text-neutral-300">
                {translate(dictionary, "public-profile:consumer_menu_links_description")}
            </p>
            <div className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rows.map((consumer) => (
                    <div key={consumer.id} className="w-full">
                        <Consumer
                            key={consumer.id}
                            id={consumer.id}
                            code={consumer.code}
                            loading={isFetching}
                            lang={lang}
                        />
                    </div>
                ))}
            </div>

            <Pagination
                dictionary={dictionary}
                lang={lang}
                group={"menu"}
                totalCount={totalCount}
                page={page}
                limit={limit}
                updatePage={updatePage}
                updateLimit={updateLimit}
            />
        </div>
    );
}

export default ConsumerList;