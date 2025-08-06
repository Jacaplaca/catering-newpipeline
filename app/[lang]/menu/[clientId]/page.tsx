import { type Page } from '@prisma/client';
import { getClientFromApi } from '@root/app/lib/getClientFromApi';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import Documents from '@root/app/specific/components/Documents';
import { type NextPage } from 'next';

const pageName = 'menu';

const menu: NextPage<{
  params: Promise<{
    lang: LocaleApp;
    clientId: string;
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang;

  const page = await getContentFromApi({ lang, key: pageName }) as Page;
  const { title, h1, description } = page;
  const schemaBreadcrumb = breadcrumbGen({ title, lang, page: pageName });

  const clientName = await getClientFromApi({ clientId: params.clientId });

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
      {clientName && (
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
          {clientName}
        </h2>
      )}

      <div className="mt-10">
        <Documents
          lang={lang}
          clientId={params.clientId}
          pageName={pageName}
        />
      </div>
    </PageLayout>
  );
};

export default menu
