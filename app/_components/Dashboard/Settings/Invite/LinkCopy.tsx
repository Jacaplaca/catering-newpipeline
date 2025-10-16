import CopyButton from '@root/app/_components/ui/buttons/CopyButton';
import LongText from '@root/app/_components/ui/LongText';
import { type FC } from 'react';

const LinkCopy: FC<{
    link: string,
    label: string,
    horizontal?: boolean,
    labelWidth?: string
}> = ({ link, label, horizontal, labelWidth }) => {

    return (
        <LongText
            label={label}
            text={link}
            horizontal={horizontal}
            labelWidth={labelWidth}
            ActionButton={() => <CopyButton content={link} />}
        />
    )
};

export default LinkCopy;