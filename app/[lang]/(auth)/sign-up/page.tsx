import { type Page } from '@prisma/client';
import MDXContent from '@root/app/_components/MDXContent';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import translate from '@root/app/lib/lang/translate';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import { api } from '@root/app/trpc/server';
import SignUpForm from 'app/_components/form/SignUpForm';
import { type NextPage } from 'next';
const pageName = 'sign-up';



const signUp: NextPage<{
  searchParams: Promise<Record<string, string>>,
  params: Promise<{
    lang: string,
  }>;
}> = async (props) => {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const lang = params.lang as LocaleApp;
  const inviteToken = searchParams.invite;

  const [dictionary, authSettings, page, authValidatorsErrors] = await Promise.all([
    getDictFromApi(lang, ["sign-up", 'shared', "invite"]),
    getSettingsFromApi('auth'),
    getContentFromApi({ lang, key: pageName }),
    getDictFromApi(lang, "auth-validators-errors")
  ]);

  const inviteTokenMessage = inviteToken ? await api.token.getInviteTokenDetails({ token: inviteToken, lang }) : null;
  const inviteTokenError = inviteToken && !inviteTokenMessage ? translate(dictionary, "invite:form-error-token-invalid") : null;

  const { title, h1, description, content } = page as Page;
  const schemaBreadcrumb = breadcrumbGen({ title, lang, page: pageName });

  return (
    <PageLayout
      h1={h1}
      seoData={{
        title,
        description,
        url: makeHref({ lang, page: pageName }, true),
      }}
      schemaBreadcrumb={schemaBreadcrumb}
      lang={lang}
    >
      <SignUpForm
        dictionary={dictionary}
        authErrors={authValidatorsErrors}
        lang={lang}
        settings={authSettings}
        info={inviteTokenMessage}
        tokenError={inviteTokenError}
      >
        {content[0] ? <MDXContent content={content[0]} className="info-form" /> : null}
      </SignUpForm>
    </PageLayout>
  );
};


export default signUp;
