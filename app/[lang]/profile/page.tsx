import { type Page } from '@prisma/client';
import ProfilePage from '@root/app/_components/Profile/ProfilePage';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import { type NextPage } from 'next';

const pageName = 'profile';

const Profile: NextPage<{
  params: Promise<{
    lang: string;
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang as LocaleApp;

  const page = await getContentFromApi({ lang, key: pageName })
  const { title, description } = page as Page;
  const schemaBreadcrumb = breadcrumbGen({ title, lang, page: pageName });

  return (
    <PageLayout
      seoData={{
        title,
        description,
        url: makeHref({ lang, page: pageName }, true),
      }}
      schemaBreadcrumb={schemaBreadcrumb}
      isLogged
      lang={lang}
    >
      <ProfilePage lang={lang} />
    </PageLayout>
  );
};

export default Profile;
