import { type FunctionComponent } from 'react';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import { api } from '@root/app/trpc/server';
import translate from '@root/app/lib/lang/translate';
import { ActivityLogAction } from '@prisma/client';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

const activityLogTypes = {
    [ActivityLogAction.update_consumer_food]: 'activity-log:activity_type_update_consumer_food',
};

const ActivityLog: FunctionComponent<{
    lang: LocaleApp,
    pageName: string,
}> = async ({ lang, pageName }) => {

    const [
        dictionary,
    ] = await Promise.all([
        getDictFromApi(lang, ["activity-log"]),
    ])

    const activityLog = await api.specific.activityLog.consumerFood();

    if (!activityLog || activityLog.length === 0) {
        return (
            <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                {translate(dictionary, 'activity-log:no_activity_available')}
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6 text-neutral-800 dark:text-neutral-100">
                {translate(dictionary, 'activity-log:title')}
            </h1>

            <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-neutral-200 dark:border-neutral-700">
                <table className="w-full text-sm text-left text-neutral-500 dark:text-neutral-400">
                    <thead className="text-xs text-neutral-700 uppercase bg-neutral-50 dark:bg-darkmode-table-darker dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 w-48 whitespace-nowrap">
                                {translate(dictionary, 'activity-log:data_column')}
                            </th>
                            <th scope="col" className="px-6 py-3">
                                {translate(dictionary, 'activity-log:details_column')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityLog.map((day) => (
                            <tr
                                key={day.date}
                                className="bg-white border-b dark:bg-darkmode-table-darker dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-darkmode-table-lighter transition-colors"
                            >
                                <td className="px-6 py-4 font-medium text-neutral-900 whitespace-nowrap dark:text-white align-top">
                                    {format(new Date(day.date), 'd MMMM yyyy', { locale: pl })}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-6">
                                        {day.actions.map((actionData, actIndex) => (
                                            <div key={actIndex} className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        {translate(dictionary, activityLogTypes[actionData.action as keyof typeof activityLogTypes])}
                                                    </span>
                                                </div>
                                                <div className="pl-1">
                                                    <ul className="space-y-2">
                                                        {actionData.users.map((user, uIndex) => (
                                                            <li key={uIndex} className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300 text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-600"></div>
                                                                    <span>{user.email}</span>
                                                                </div>
                                                                <span className="flex items-center justify-center min-w-[2rem] h-6 px-2 text-xs font-semibold text-neutral-700 bg-neutral-100 rounded-md dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700" title="Liczba operacji">
                                                                    {user.count}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default ActivityLog;
