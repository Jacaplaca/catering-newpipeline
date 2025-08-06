'use client';
import signOutWithRedirect from '@root/app/lib/signOutWithRedirect';
import { useEffect } from 'react';
const SignOutComponent: React.FC<{ lang: LocaleApp }> = ({ lang }) => {
    const redirect = async () => {
        await signOutWithRedirect(lang)
    }

    useEffect(() => {
        void redirect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};


export default SignOutComponent;
