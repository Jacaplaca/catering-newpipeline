import makeHref from '@root/app/lib/url/makeHref';
import { NextResponse, type NextRequest } from 'next/server'

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

    const url = makeHref({
        lang: lang as LocaleApp,
        page: "sign-up",
        params: new URLSearchParams({
            invite: token.toLowerCase().trim()
        })
    }, true);

    const response = NextResponse.redirect(url);

    response.cookies.set('next-auth.session-token', '', {
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        sameSite: 'lax'
    });

    return response;
}

