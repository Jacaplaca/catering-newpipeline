import CopyButton, { type CopyButtonRef } from '@root/app/_components/ui/buttons/CopyButton';
import Tooltip from '@root/app/_components/ui/Tooltip';
import translate from '@root/app/lib/lang/translate';
import makeHref from '@root/app/lib/url/makeHref';
import { useConsumerTableContext } from '@root/app/specific/components/Consumers/context';
import { useRef, type FC } from 'react';

const CopyLink: FC<{ id: string, disabled?: boolean }> = ({ id, disabled = false }) => {

    const {
        lang,
        dictionary,
    } = useConsumerTableContext();

    const href = makeHref({ lang, page: 'menu', slugs: [id] }, true)

    const copyRef = useRef<CopyButtonRef>(null);

    // const handleExternalClick = () => {
    //     copyRef.current?.copy();
    // };

    return <Tooltip content={disabled ? "" : translate(dictionary, "consumers:copy_button_tooltip")}>
        <CopyButton content={href} ref={copyRef} isSkeleton={disabled} />
    </Tooltip>
}

export default CopyLink;