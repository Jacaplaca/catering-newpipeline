import getSmtpTransport from '@root/app/server/email/libs/smtpOptions';
import { env } from "@root/app/env";
import { db } from '@root/app/server/db';
import { marked } from 'marked';
import populateEmailTemplate from '@root/app/lib/populateEmailTemplate';
import { replaceVariables } from '@root/app/server/lib/replaceVariables';
import { getSetting } from '@root/app/server/cache/settings';
import { getDict } from '@root/app/server/cache/translations';
import logger from '@root/app/lib/logger';

export type CustomEmailSettings = {
    options: {
        host: string,
        port: number,
        auth: {
            user: string,
            pass: string,
        },
    },
    templateWrapper: string,
    lang: LocaleApp,
    fromAlias: string,
    contactAdmin: string,
    from: string,
}

const sendMail = async ({ to, dynamicContext, templateName, lang, staticContext, customSettings }: {
    to: string,
    dynamicContext: Record<string, string>,
    templateName: string,
    lang: LocaleApp,
    staticContext?: Record<string, string>,
    customSettings?: CustomEmailSettings
}) => {
    const smtpTransport = await getSmtpTransport(customSettings?.options);

    const dictionary = await getDict({ lang, key: 'email' });

    const siteName = await getSetting<string>('main', 'siteName');
    const siteLogoPath = await getSetting<string>('main', 'logoLight');
    const siteLogoUrl = `${env.DOMAIN}/file${siteLogoPath}`;
    const adminEmail = customSettings?.contactAdmin ?? await getSetting<string>('admin', 'email');
    const adminPhone = await getSetting<string>('admin', 'phone');


    const context = {
        siteName,
        phoneLabel: dictionary.phone_label ?? 'Phone',
        emailLabel: dictionary.email_label ?? 'Email',
        ...staticContext,
        logoUrl: staticContext?.logoUrl ?? siteLogoUrl,
        contactPhone: staticContext?.contactPhone ?? adminPhone,
        contactEmail: staticContext?.contactEmail ?? adminEmail,
        adminEmail,
        adminPhone,
        siteLogoUrl,
        ...dynamicContext,
    }

    const template = await db.emailTemplate.findFirst({
        where: {
            key: templateName,
            lang
        }
    });

    if (!template) {
        throw new Error("Email template not found");
    }

    const { subject, text, content } = template;

    const { textWithContext, contentWithContext, subjectWithContext } = populateEmailTemplate({ content, text, subject, context });

    const htmlContent = await marked.parse(contentWithContext[0] ?? "");

    const alias = customSettings?.fromAlias ?? await getSetting<string>('email', 'fromAlias');

    const fromEmailAddress = customSettings?.from ?? await getSetting<string>('email', 'from');
    const from = `${alias} <${fromEmailAddress}>`

    const emailTemplateHtmlWrapper = customSettings?.templateWrapper ?? await getSetting<string>('email', 'templateHtmlWrapper');

    const richHtml = replaceVariables(emailTemplateHtmlWrapper, {
        content: htmlContent,
        ...context
    })

    try {
        const result = await smtpTransport.sendMail({
            to,
            subject: subjectWithContext,
            text: textWithContext,
            html: richHtml,
            from
        })

        const failed = result.rejected.concat(result.pending).filter(Boolean)
        if (failed.length) {
            const errorMsg = `Email(s) (${failed.join(", ")}) could not be sent`;
            logger.error(errorMsg);
            throw new Error(errorMsg)
        }

        logger.info(`Email sent successfully to: ${to}, subject: ${subjectWithContext}`);
    } catch (error) {
        logger.error(`Failed to send email to: ${to}, error: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

export default sendMail