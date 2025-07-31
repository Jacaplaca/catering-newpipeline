'use client';

import Drawer from '@root/app/_components/Drawer';
import useBreakpoint from '@root/app/hooks/useBreakpoint';
import { type DashboardMenuElement } from '@root/types';
import { useEffect, useState, type FunctionComponent } from 'react';
import { useRouter } from 'next/navigation';
import { useBoolean } from 'usehooks-ts';
import { useCheckSettings } from '@root/app/hooks/calls';

const Dashboard: FunctionComponent<{ children: React.ReactNode, menu: DashboardMenuElement[], searchParams: Record<string, string> }> = ({ children, menu, searchParams }) => {
    const { value: isOpen, setTrue, setFalse, toggle } = useBoolean(false);
    const [selectedItem, setSelectedItem] = useState<string>('');
    const breakpoint = useBreakpoint();
    const router = useRouter();

    const { hasFinishedSettings, checkFinishedSettingsRefetch } = useCheckSettings();

    useEffect(() => {
        if (breakpoint === 'sm' || breakpoint === 'xs') {
            setFalse();
        } else {
            setTrue();
        }
    }, [breakpoint, setFalse, setTrue])


    const selectItem = async (key: string) => {
        setSelectedItem(key);
        const newSearchParams = new URLSearchParams({ key });
        let forceSettingsHere = !hasFinishedSettings
        if (forceSettingsHere) {
            const { data } = await checkFinishedSettingsRefetch();
            forceSettingsHere = !data;
        }
        router.push(`?${forceSettingsHere ? "key=settings" : newSearchParams.toString()}`);
    }

    return (
        <div className='flex w-full flex-1 bg-white dark:bg-neutral-900'>
            <Drawer
                menu={menu}
                isOpen={isOpen}
                toggleDrawer={toggle}
                handleClick={selectItem}
                selected={selectedItem}
            />
            <div className='p-2 sm:p-6 w-full'>
                {isOpen && breakpoint === 'xs' ? null : children}
            </div>
        </div>
    )
}

export default Dashboard;