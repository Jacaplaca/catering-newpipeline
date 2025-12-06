import getCurrentTime from '@root/app/lib/date/getCurrentTime';
import { removeExpiredChangeEmailTokens } from '@root/app/lib/removeExpiredTokens';
import makeHref from '@root/app/lib/url/makeHref';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server'
import { db } from "server/db";

type RouteProps = {
    params: Promise<{
        token: string;
        lang: string;
    }>;
}

export async function GET(
    request: NextRequest,
    props: RouteProps
) {
    const params = await props.params;
    const { token, lang } = params;
    const signInPage = 'sign-in'

    const tokenExists = await db.changeEmailToken.findUnique({
        where: {
            token: token.toLowerCase().trim(),
            expires: {
                gt: getCurrentTime()
            }
        },
    });

    if (!tokenExists) {
        const url = makeHref({ lang: lang as LocaleApp, page: signInPage, params: new URLSearchParams({ tokenNotFound: "true" }) });
        return redirect(url);
    }

    await db.changeEmailToken.delete({
        where: {
            token: token.toLowerCase().trim()
        }
    })

    await removeExpiredChangeEmailTokens()

    await db.user.update({
        where: {
            id: tokenExists.userId
        },
        data: {
            email: tokenExists.newEmail,
            emailVerified: getCurrentTime()
        }
    })


    const url = makeHref({ lang: lang as LocaleApp, page: signInPage, params: new URLSearchParams({ emailVerified: "true" }) });
    return redirect(url);
}