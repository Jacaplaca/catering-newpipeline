import { useState } from 'react';

const useToggleEditable4Client = () => {
    const [isMenuEditableForClient, setIsMenuEditableForClient] = useState(false);

    const setNotEditable4Client = () => {
        setIsMenuEditableForClient(false);
    }

    const setEditable4Client = () => {
        setIsMenuEditableForClient(true);
    }

    return { isMenuEditableForClient, setNotEditable4Client, setEditable4Client };

};

export default useToggleEditable4Client;