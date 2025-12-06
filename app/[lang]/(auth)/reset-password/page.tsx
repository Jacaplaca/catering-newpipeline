import { type Page } from '@prisma/client';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import ResetPasswordForm from 'app/_components/form/ResetPasswordForm';
import { type NextPage } from 'next';

const pageName = 'reset-password';

const ResetPassword: NextPage<{
  params: Promise<{
    lang: string
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang as LocaleApp;

  const [dictionary, page] = await Promise.all([
    getDictFromApi(lang, "reset-password"),
    getContentFromApi({ lang, key: pageName })
  ]);

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
      <ResetPasswordForm dictionary={dictionary} lang={lang} />
    </PageLayout>
  );
};

export default ResetPassword;
