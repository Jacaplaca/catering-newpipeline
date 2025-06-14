import { type FunctionComponent } from 'react';
import { Badge } from "flowbite-react";

const FieldMultiple: FunctionComponent<{ items: { id: string, name: string }[] }> = ({ items }) => {
    if (!items) {
        return null;
    }
    return (
        <div className="flex flex-wrap gap-2 p-2">
            {items.map((item) => (
                <Badge
                    key={item.id}
                    color="info"
                    className={`cursor-pointer bg-secondary/50 
                                dark:bg-neutral-700 rounded-full
                                dark:text-neutral-100 text-neutral-900
                                `}
                >
                    {item.name}
                </Badge>
            ))}
        </div>
    )
};

export default FieldMultiple;