
import { Menu, Transition } from "@headlessui/react";
import { Fragment, type ReactNode, type FunctionComponent } from "react";

const ContextMenu: FunctionComponent<{
    button: ReactNode | null;
    items?: ReactNode[];
    children?: React.ReactNode;
    disabled?: boolean;
}> = ({ button, items, children, disabled }) => {

    return (
        <Menu as="div" className="relative ml-4 shrink-0 ">
            <Menu.Button className=" "
                disabled={disabled}
            >{button}</Menu.Button>
            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <div className='relative' >
                    <div className='absolute context-menu' >
                        {children}
                        {items}
                    </div>
                </div>
            </Transition>
        </Menu>
    )
}

export default ContextMenu;