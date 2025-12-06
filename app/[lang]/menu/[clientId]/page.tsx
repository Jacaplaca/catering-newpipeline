import { type Page } from '@prisma/client';
import { getUserFromApi } from '@root/app/lib/getUserFromApi';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import { type NextPage } from 'next';
import PublicData from '@root/app/specific/components/PublicData';

const pageName = 'menu';

const menu: NextPage<{
  params: Promise<{
    lang: string;
    clientId: string;
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang as LocaleApp;

  const page = await getContentFromApi({ lang, key: pageName }) as Page;
  const { title, h1, description } = page;
  const schemaBreadcrumb = breadcrumbGen({ title, lang, page: pageName });

  const userPublicData = await getUserFromApi({ clientId: params.clientId });

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
      <div className='w-full h-full dark:bg-neutral-800/50 rounded-lg p-6'>
        <div className='pt-6'>
          {/* asdf */}
          {userPublicData && (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8 text-center">
              {userPublicData.name}
            </h2>
          )}
          {userPublicData && <div className="mt-10">
            <PublicData
              id={params.clientId}
              role={userPublicData?.role}
              lang={lang}
              pageName={pageName}
            />
          </div>}
        </div>
      </div>
    </PageLayout>
  );
};

export default menu
