import type { NextPage } from 'next';
import CreateNewPasswordForm from 'app/_components/form/CreateNewPassword';
import PageLayout from '@root/app/partials/PageLayout';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import { type Page } from '@prisma/client';
import translate from '@root/app/lib/lang/translate';
import makeHref from '@root/app/lib/url/makeHref';

const pageName = "change-password";

const ChangePassword: NextPage<{
  params: Promise<{
    lang: string;
    token: string;
  }>;
}> = async (props) => {
  const params = await props.params;
  const { token, lang: langParam } = params;
  const lang = langParam as LocaleApp;

  const [dictionary, authErrors, authSettings, page] = await Promise.all([
    getDictFromApi(lang, "change-password"),
    getDictFromApi(lang, "auth-validators-errors"),
    getSettingsFromApi('auth'),
    getContentFromApi({ lang, key: pageName })
  ])

  const { title, h1, description } = page as Page;
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
      {token === "invalid-token" ?
        <div id='error-invalid-token'>
          <i className="fas fa-do-not-enter"></i>
          <h2>{translate(dictionary, 'invalid_token')}</h2>
        </div>
        : <CreateNewPasswordForm
          token={token}
          authErrors={authErrors}
          dictionary={dictionary}
          lang={lang}
          settings={authSettings}
          isPage
        />}
    </PageLayout>
  );
};

export default ChangePassword;
