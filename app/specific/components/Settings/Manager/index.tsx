'use client';

import { type FunctionComponent } from 'react';
import useManagerSettings from '@root/app/specific/components/Settings/Manager/useSettings';
import SettingsFormRenderer from '@root/app/_components/Dashboard/Settings/FormRenderer';
import NonWorkinDays from '@root/app/specific/components/Settings/Manager/NonWorkinDays';

const ManagerSettings: FunctionComponent<{
    dictionary: Record<string, string>
    lang: LocaleApp
}> = ({ dictionary, lang }) => {
    const {
        form,
        onSubmit,
        hasFinishedSettings,
        Inputs,
        nonWorkingDays,
        setNonWorkingDays,
    } = useManagerSettings({ dictionary });

    return (
        <SettingsFormRenderer
            dictionary={dictionary}
            onSubmit={onSubmit}
            form={form}
            hasFinishedSettings={hasFinishedSettings}
        >
            <div className="space-y-8 pb-6" > {Inputs}</div>
            <NonWorkinDays
                dictionary={dictionary}
                lang={lang}
                nonWorkingDays={nonWorkingDays || []}
                setNonWorkingDays={setNonWorkingDays}
            />
        </SettingsFormRenderer>
    );
};

export default ManagerSettings;
