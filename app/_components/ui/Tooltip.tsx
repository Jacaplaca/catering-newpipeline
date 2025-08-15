import { Tooltip as FlowbiteTooltip, type TooltipProps } from "flowbite-react";
import { type FC } from 'react';

const theme = {
    "target": "w-fit",
    "animation": "transition-opacity",
    "arrow": {
        "base": "absolute z-10 h-2 w-2 rotate-45",
        "style": {
            "dark": "bg-neutral-900 dark:bg-neutral-700",
            "light": "bg-white",
            "auto": "bg-white dark:bg-neutral-700"
        },
        "placement": "-4px"
    },
    "base": "absolute z-10 inline-block rounded-lg px-3 py-2 text-sm font-medium shadow-sm",
    "hidden": "invisible opacity-0",
    "style": {
        "dark": "bg-neutral-900 text-white dark:bg-neutral-700",
        "light": "border border-neutral-200 bg-white text-neutral-900",
        "auto": "border border-neutral-200 bg-white text-neutral-900 dark:border-none dark:bg-neutral-700 dark:text-white"
    },
    "content": "relative z-20 normal-case"
}

const Tooltip: FC<TooltipProps> = ({ children, ...props }) => {

    if (!props.content) return <>{children}</>;

    return <FlowbiteTooltip
        theme={theme}
        {...props}
    >{children}
    </FlowbiteTooltip>
}

export default Tooltip;