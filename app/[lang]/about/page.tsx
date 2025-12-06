import { type Page } from '@prisma/client';
import MDXContent from '@root/app/_components/MDXContent';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import { type NextPage } from 'next';

const pageName = 'about';

const about: NextPage<{
  params: Promise<{
    lang: string;
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang as LocaleApp;

  const page = await getContentFromApi({ lang, key: pageName }) as Page;
  const { title, h1, description, content } = page;
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
      <MDXContent content={content.join()} />
    </PageLayout>
  );
};

export default about
