import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import { type NextPage } from 'next';
import translate from '@root/app/lib/lang/translate';
import getMainPageUrl from '@root/app/lib/url/getMainPageUrl';

const NotFoundCatchAll: NextPage<{
    params: Promise<{
        lang: string
    }>;
}> = async (props) => {
    const params = await props.params;
    const lang = params.lang as LocaleApp;

    const dict = await getDictFromApi(lang, ["404"])
    const mainPage = getMainPageUrl(lang);

    return <div
        className="font-firaCode bg-gray-200 dark:bg-zinc-800 w-full px-16 md:px-0 h-screen flex items-center justify-center">
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center px-4 md:px-8 lg:px-24 py-8 rounded-lg shadow-2xl">
            <p className="text-6xl md:text-7xl lg:text-9xl font-bold  text-gray-300 ">{translate(dict, '404:error-code')}</p>
            <p className="text-2xl md:text-3xl lg:text-5xl font-bold  text-gray-500 mt-4">{translate(dict, '404:title')}</p>
            <p className="text-gray-500 mt-4 pb-4 border-b-2 text-center">{translate(dict, '404:description')}</p>
            <a href={mainPage} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-gray-100 px-4 py-2 mt-6 rounded transition duration-150" title="Return Home">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
                </svg>
                <span>{translate(dict, '404:back')}</span>
            </a>
        </div>
    </div>
}

export default NotFoundCatchAll;