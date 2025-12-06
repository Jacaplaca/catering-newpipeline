import getCurrentTime from '@root/app/lib/date/getCurrentTime';
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

    const tokenExists = await db.resetPasswordToken.findUnique({
        where: {
            token: token.toLowerCase().trim(),
            expires: {
                gt: getCurrentTime()
            }
        },
    });

    if (!tokenExists) {
        return redirect(makeHref({ lang: lang as LocaleApp, page: 'change-password', slugs: ['invalid-token'] }))
    }
    const newHref = makeHref({ lang: lang as LocaleApp, page: 'change-password', slugs: [token] });
    redirect(newHref)
}