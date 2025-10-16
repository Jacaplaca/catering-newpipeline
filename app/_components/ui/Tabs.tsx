import { Tabs as FlowbiteTabs, type TabStyles, type TabItemProps } from "flowbite-react";
import { type FC } from "react";

const theme = {
    "base": "flex flex-col gap-2",
    "tablist": {
        "base": "flex text-center",
        "variant": {
            "default": "flex-wrap border-b border-neutral-200 dark:border-neutral-700",
            "underline": "-mb-px flex-wrap border-b border-neutral-200 dark:border-neutral-700",
            "pills": "flex-wrap space-x-2 text-sm font-medium text-neutral-500 dark:text-neutral-400",
            "fullWidth": "grid w-full grid-flow-col divide-x divide-neutral-200 rounded-none text-sm font-medium shadow dark:divide-neutral-700 dark:text-neutral-400"
        },
        "tabitem": {
            "base": "flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none focus:ring-1 focus:ring-secondary disabled:cursor-not-allowed disabled:text-neutral-400 disabled:dark:text-neutral-500",
            "variant": {
                "default": {
                    "base": "rounded-t-lg",
                    "active": {
                        "on": "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
                        "off": "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                    }
                },
                "underline": {
                    "base": "rounded-t-lg",
                    "active": {
                        "on": "active rounded-t-lg border-b-2 border-cyan-600 text-cyan-600 dark:border-cyan-500 dark:text-cyan-500",
                        "off": "border-b-2 border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-600 dark:text-neutral-400 dark:hover:text-neutral-300"
                    }
                },
                "pills": {
                    "base": "",
                    "active": {
                        "on": "rounded-lg bg-cyan-600 text-white",
                        "off": "rounded-lg hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
                    }
                },
                "fullWidth": {
                    "base": "ml-0 flex w-full rounded-none first:ml-0",
                    "active": {
                        "on": "active rounded-none bg-neutral-100 p-4 text-neutral-900 dark:bg-neutral-700 dark:text-white",
                        "off": "rounded-none bg-white hover:bg-neutral-50 hover:text-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:hover:text-white"
                    }
                }
            },
            "icon": "mr-2 h-5 w-5"
        }
    },
    "tabitemcontainer": {
        "base": "",
        "variant": {
            "default": "",
            "underline": "",
            "pills": "",
            "fullWidth": ""
        }
    },
    "tabpanel": "py-3"
}

const Tabs: FC<TabItemProps & { variant?: keyof TabStyles, onActiveTabChange?: (tab: number) => void }> = ({ variant = 'underline', onActiveTabChange, children }) => {
    return (
        <FlowbiteTabs
            aria-label="Tabs with underline"
            variant={variant}
            theme={theme}
            onActiveTabChange={onActiveTabChange}
        >
            {children}
        </FlowbiteTabs>
    );
};

export default Tabs;