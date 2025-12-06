import PageLayout from '@root/app/partials/PageLayout';
import { type NextPage } from 'next';
import SignInView from '@root/app/_components/SignInView';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import { type Page } from '@prisma/client';
import makeHref from '@root/app/lib/url/makeHref';

const pageName = 'sign-in';

const signIn: NextPage<{
  params: Promise<{
    lang: string
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang as LocaleApp;

  const page = await getContentFromApi({ lang, key: pageName });
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
      <SignInView
        lang={lang}
        redirectUrl="/"
        content={content[0] ?? ""}
      />
    </PageLayout>
  );
};

export default signIn;
