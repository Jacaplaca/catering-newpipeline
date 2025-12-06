"use client";

import { type DashboardMenuElement } from '@root/types';
import {
    Drawer as DrawerFlowbite,
    DrawerItems as DrawerFlowbiteItems,
    Sidebar,
    SidebarItem,
    SidebarItemGroup,
    SidebarItems,
} from "flowbite-react";
import { useSearchParams } from 'next/navigation';
import { type FunctionComponent, useState, useEffect, type JSX } from "react";

const Drawer: FunctionComponent<{
    isOpen: boolean,
    toggleDrawer: () => void,
    menu: DashboardMenuElement[],
    handleClick: (key: string) => void
    selected?: string
}> = ({ menu, isOpen, toggleDrawer, handleClick, selected }) => {
    const searchParams = useSearchParams();

    const [openedItems, setOpenedItems] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    useEffect(() => {
        const selectedKey = selected ? selected : searchParams.get('key');
        setSelectedKey(selectedKey);
        const openedKeys = menu.filter(group => group.key && group.opened)
            .map(group => group.key) as string[];
        if (selectedKey) {
            const selectedGroup = menu.find(group => group.items.some(item => item.key === selectedKey));
            if (selectedGroup?.key) {
                openedKeys.push(selectedGroup.key);
            }
        }
        const opended = [...openedItems, ...openedKeys];
        setOpenedItems(opended)
    }, [selected])

    const openGroup = (key: string) => setOpenedItems(openedItems.includes(key) ? openedItems.filter(item => item !== key) : [...openedItems, key]);

    const isOpened = (key: string) => openedItems.includes(key);

    const menuList = menu.reduce((acc, group, index) => {
        const { label, key, icon, items } = group;
        if (key && label && isOpen) {
            acc.push(
                <button
                    key={`group-${key}-${index}`}
                    onClick={() => openGroup(key)}
                    className={`flex gap-3 items-center w-full
                    pr-6 mb-0  pl-4 pb-2 dark:text-darkmode-drawer-icon text-drawer-icon font-semibold`}
                >
                    {icon && <i className={`w-3 ${icon} `} />}
                    <p className={`${isOpen ? 'visible' : 'invisible'} text-base`}>{label}</p>
                    <i className={`fas fa-chevron-up ml-auto text-xs
transition-transform duration-200 ${isOpened(key) && "rotate-180"}`}></i>
                </button>
            );
        }

        acc.push(
            <SidebarItemGroup
                key={`item-${key}-${label}-${index}`}
                className={`p-0 m-0 pl-0 ${key && 'pl-0'}
${key ? (isOpened(key) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0') : ""}
border-0 pb-3
${key ? 'transition-all duration-300 ease-in-out overflow-hidden' : ''}`}
            >
                {items.map((item, itemIndex) => {
                    const Icon = () => {
                        return <i key={'icon' + itemIndex} className={`${item.icon} `} />
                    }
                    const itemContent = (
                        <SidebarItem
                            key={"item" + item.key}
                            {...(item.url
                                ? { href: item.url }
                                : { onClick: () => handleClick(item.key) }
                            )}
                            icon={isOpen ? Icon : undefined}
                            className={`px-4 cursor-pointer text-sm font-medium
                            hover:dark:bg-darkmode-secondary hover:bg-secondary
                            hover:dark:text-white hover:text-neutral-800
                            transition-all duration-150
                            ${group.key ? 'pb-1.5 pt-1.5' : ''}

                            ${selectedKey === item.key
                                    ? `font-semibold dark:text-darkmode-drawer-icon-selected text-drawer-icon-selected
                                dark:bg-neutral-800 bg-neutral-200`
                                    : `dark:text-darkmode-drawer-icon text-drawer-icon`}`}
                        >
                            {isOpen ? <p>{item.label}</p> : <Icon />}
                        </SidebarItem>
                    );

                    return key ? (
                        <div
                            key={"animated-item" + item.key}
                            className={`transform transition-all duration-300 ease-in-out
                            py-0 my-0
${isOpened(key) ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
${itemIndex > 0 ? `delay-[${itemIndex * 50}ms]` : ''}
${isOpen ? "ps-3" : "ps-0"}
`}>{itemContent}</div>) : itemContent;
                })}
            </SidebarItemGroup>
        );

        // acc.push(<div key={'spacer-in-dashboard'} className='pb-6'></div>)

        return acc;
    }, [] as JSX.Element[]);

    return (
        <DrawerFlowbite
            open={true}
            onClose={() => { return }}
            backdrop={false}
            theme={
                {
                    root: {
                        base: `
        transition-w duration-300 ${isOpen ? "!w-64" : "!w-16"}
        left-0 !h-full p-0 dark:bg-darkmode-drawer-background bg-drawer-background 
        shadow-drawer dark:shadow-darkmode-drawer
        `,
                        backdrop: "bg-black bg-opacity-50",
                        // edge: "border-r border-red-800",
                    },
                }
            }
        >
            <DrawerFlowbiteItems
                className={`dark:bg-darkmode-drawer-background
bg-drawer-background text-white  `}
            ><button onClick={toggleDrawer} className={`w-full pb-3 pt-3 hover:dark:bg-neutral-800 hover:bg-neutral-200  ${isOpen ? "justify-end pr-3" : "justify-center pr-0"}  flex `}>
                    <i className={`
    fas fa-chevrons-right dark:text-darkmode-drawer-icon text-drawer-icon
    ${isOpen && 'rotate-180'}`} />
                </button>
                {true && <Sidebar
                    aria-label="Sidebar with multi-level dropdown example"
                    className={`${isOpen ? "!w-64" : "!w-16"} [&>div]:bg-transparent [&>div]:p-0 px-2`}>
                    <div className="flex h-full flex-col justify-between py-2 dark:bg-darkmode-drawer-background bg-drawer-background">
                        <div className='pt-0'>
                            <SidebarItems className='pl-0 ' >
                                {menuList}
                            </SidebarItems>
                        </div>
                    </div>
                </Sidebar>}
            </DrawerFlowbiteItems>

        </DrawerFlowbite>
    );
}

export default Drawer;
