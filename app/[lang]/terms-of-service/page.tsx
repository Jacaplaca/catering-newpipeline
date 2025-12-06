import { type Page } from '@prisma/client';
import MDXContent from '@root/app/_components/MDXContent';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import { type NextPage } from 'next';

const pageName = 'terms-of-service';

const TermsOfService: NextPage<{
  params: Promise<{
    lang: string;
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
      lang={lang}
      schemaBreadcrumb={schemaBreadcrumb}
    >
      <MDXContent content={content.join()} />
    </PageLayout>
  );
};

export default TermsOfService;
