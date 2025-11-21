import { type FunctionComponent } from 'react';
import LocaleSwitcher from '@root/app/_components/LocaleSwitcher';
import Logo from '@root/app/_components/Logo';
import NavbarToggler from '@root/app/_components/NavbarToggler';
import Navigation from './Navigation';
import ThemeSwitcher from '@root/app/_components/ThemeSwitcher';
import ProfileButton from '@root/app/_components/Profile/ProfileButton';
import getDictFromApi from '@root/app/lib/lang/getDictFromApi';
import { getContentFromApi } from '@root/app/lib/getContentFromApi';
import { type MdContent } from '@prisma/client';
import MDXContent from '@root/app/_components/MDXContent';
import { env } from '@root/app/env';
import { i18n } from '@root/i18n-config';
import InformationalBanner from '@root/app/_components/Banners/Informational';
import translate from '@root/app/lib/lang/translate';
import getSettingsFromApi from '@root/app/lib/settings/getSettingsFromApi';
import { auth } from '@root/app/server/auth';
import PaymentReminder from '@root/app/_components/PaymentReminder';
export interface ChildNavigationLink {
  name: string;
  url: string;
}

const CustomListItem: FunctionComponent<{
  children: React.ReactNode;
}> = ({ children }) => (
  <li className="custom-class">
    <i className="fas fa-check-circle"></i>
    {children}
  </li>
);

const components = {
  li: CustomListItem
};

const Header: FunctionComponent<{
  lang?: LocaleApp;
  personalization: {
    logoDark: string;
    logoLight: string;
  }
}> = async (props) => {

  const stickyHeader = true;

  const { lang = env.DEFAULT_LOCALE, personalization } = props;
  const session = await auth();
  const dictionary = await getDictFromApi(lang, ["shared", "profile-button", "banner"])
  const profileButtonContent = await getContentFromApi({ lang, key: 'profileButton', contentType: 'mdContent' }) as MdContent;
  const settings = await getSettingsFromApi('app') as unknown as { active: boolean };
  const role = session?.user.roleId;
  const isManager = role === 'manager';

  return (
    <header
      className={`header z-30 ${stickyHeader && "sticky top-0"} 
      bg-primary dark:bg-darkmode-primary shadow
      `}
    >
      {/* overflow-auto	       */}
      <nav className="navbar container">
        <div className="order-0">
          <Logo
            lang={lang}
            logoDark={personalization.logoDark}
            logoLight={personalization.logoLight}
          />
        </div>
        <NavbarToggler />
        <Navigation lang={lang} />
        <div className="order-1 ml-auto flex items-center md:order-2 lg:ml-0">
          {/* {settings.search && (
            <Link
              className="mr-5 inline-block border-r border-border pr-5 text-xl text-dark hover:text-primary dark:border-darkmode-border dark:text-white"
              href={addLangToUrl("/search")}
              aria-label="search"
            >
              <IoSearch />
            </Link>
          )} */}
          <ProfileButton
            session={session}
            lang={lang}
            dictionary={dictionary}
          >
            {profileButtonContent.content[0] && <MDXContent
              content={profileButtonContent.content[0]}
              className='profile-button-content'
              components={components}
            />}
          </ProfileButton>
          <ThemeSwitcher className="mr-5" />
          {i18n.locales.length > 1 ? <LocaleSwitcher lang={lang} /> : null}
          {/* {navigation_button.enable && (
            <Link
              className="btn btn-outline-primary btn-sm hidden lg:inline-block"
              href={navigation_button.link}
            >
              {navigation_button.label}
            </Link>
          )} */}
        </div>
      </nav>
      {settings.active ? null : <InformationalBanner
        dictionary={dictionary}
        text={translate(dictionary, 'banner:conservation_work')}
      />}
      {isManager && <PaymentReminder dictionary={dictionary} />}
    </header >
  );
};

export default Header;
