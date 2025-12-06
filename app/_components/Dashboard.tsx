'use client';

import Drawer from '@root/app/_components/Drawer';
import useBreakpoint from '@root/app/hooks/useBreakpoint';
import { type DashboardMenuElement } from '@root/types';
import { useEffect, useState, type FunctionComponent } from 'react';
import { useRouter } from 'next/navigation';
import { useBoolean } from 'usehooks-ts';

const Dashboard: FunctionComponent<{ children: React.ReactNode, menu: DashboardMenuElement[] }> = ({ children, menu }) => {
    const { value: isOpen, setTrue, setFalse, toggle } = useBoolean(false);
    const [selectedItem, setSelectedItem] = useState<string>('');
    const breakpoint = useBreakpoint();
    const router = useRouter();

    useEffect(() => {
        if (breakpoint === 'sm' || breakpoint === 'xs') {
            setFalse();
        } else {
            setTrue();
        }
    }, [breakpoint, setFalse, setTrue])


    const selectItem = (key: string) => {
        setSelectedItem(key);
        const newSearchParams = new URLSearchParams();
        newSearchParams.set('key', key);
        router.push(`?${newSearchParams.toString()}`);
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
            <div className={`p-6 w-full`}>
                <div className={`${isOpen ? 'ps-64' : 'ps-16'}`}>
                    {isOpen && breakpoint === 'xs' ? null : children}
                </div>
            </div>
        </div>
    )
}

export default Dashboard;