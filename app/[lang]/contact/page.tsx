import { type Page } from '@prisma/client';
import MDXContent from '@root/app/_components/MDXContent';
import ContactForm from '@root/app/_components/form/ContactForm';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import { breadcrumbGen } from '@root/app/lib/schemaGen';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import makeHref from '@root/app/lib/url/makeHref';
import PageLayout from '@root/app/partials/PageLayout';
import { type NextPage } from 'next';

const pageName = 'contact';

const about: NextPage<{
  params: Promise<{
    lang: string;
  }>;
}> = async (props) => {
  const params = await props.params;
  const lang = params.lang as LocaleApp;

  const [page, dictionary, settings] = await Promise.all([
    getContentFromApi({ lang, key: pageName }),
    getDictFromApi(lang, "contact"),
    getSettingsFromApi('contact') as Promise<{ "maxMessageLength": number }>
  ])

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
      <div className="flex gap-10 px-4">
        <MDXContent content={content.join("")} />
        <div>
          <ContactForm
            lang={lang}
            dictionary={dictionary}
            maxMessageLength={settings.maxMessageLength ?? 1}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default about
