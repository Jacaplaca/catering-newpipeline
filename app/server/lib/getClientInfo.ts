import { headers } from 'next/headers';

type ClientInfo = {
    ip: string;
    userAgent: string;
};

export const getClientInfo = async (): Promise<ClientInfo> => {
    let ip = 'unknown';
    let userAgent = 'unknown';
    try {
        const headersList = await headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        if (forwardedFor) {
            const firstIp = forwardedFor.split(',')[0]?.trim() ?? '';
            if (firstIp) {
                ip = firstIp;
            }
        }

        userAgent = headersList.get('user-agent') ?? 'unknown';
    } catch (error) {
        // headers() might fail if not in request context
    }
    return { ip, userAgent };
};

