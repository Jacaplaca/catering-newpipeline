import { useEffect, useState } from 'react';

const useToggleMenuForConsumers = ({ day, onRowClick }: { day: { year: number, month: number, day: number } | null, onRowClick: (a: string | null) => void }) => {
    const [showMenuForConsumers, setShowMenuForConsumers] = useState(false);

    const handleShowMenuForConsumers = () => {
        setShowMenuForConsumers(!showMenuForConsumers);
        onRowClick(null);
    }

    useEffect(() => {
        setShowMenuForConsumers(false);
    }, [day]);

    return { showMenuForConsumers, handleShowMenuForConsumers };
}

export default useToggleMenuForConsumers;
