import { api } from '@root/app/trpc/react';
import { useEffect, useState } from 'react';

const useToggleMenuStandard = ({ clientId, day, isMenuEditableForClient }: {
    clientId: string,
    day: { year: number, month: number, day: number } | null
    isMenuEditableForClient: boolean
}) => {
    const utils = api.useUtils();
    const [isStandardMenuCreatorShown, setIsStandardMenuCreatorShown] = useState(false);

    const toggleStandardMenuCreator = () => {
        setIsStandardMenuCreatorShown(state => !state);
        void utils.specific.consumerFood.getByClientId.invalidate({
            clientId: clientId ?? '',
            day: day ?? { year: 0, month: 0, day: 0 },
        });
    }

    useEffect(() => {
        if (!isMenuEditableForClient) {
            setIsStandardMenuCreatorShown(false);
        }
    }, [isMenuEditableForClient, day, clientId]);

    return { isStandardMenuCreatorShown, toggleStandardMenuCreator };
};


export default useToggleMenuStandard;