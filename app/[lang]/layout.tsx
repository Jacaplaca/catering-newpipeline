import "app/styles/main.scss";
import "app/styles/globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'
import { Inter } from "next/font/google";
import { TRPCReactProvider } from "app/trpc/react";
import Providers from 'app/partials/Providers';
import { env } from '@root/app/env';
import Main from '@root/app/_components/Main';
import { LangProvider } from 'app/contexts/LangContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ lang: LocaleApp }>;
}) {
  const { children } = props;
  const params = await props.params;
  const lang = params?.lang || env.NEXT_PUBLIC_DEFAULT_LOCALE;

  return (
    <html lang={lang} suppressHydrationWarning={true}>
      <body className={`${inter.variable} min-w-fit`}>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Reset all scrollbar styles globally */
            * {
              scrollbar-width: unset !important;
              scrollbar-color: unset !important;
            }
            
            *:hover {
              scrollbar-color: unset !important;
            }
            
            /* Force thick scrollbar on html and body */
            html {
              scrollbar-width: thick !important;
              scrollbar-color: #6b7280 #f1f5f9 !important;
            }
            
            html::-webkit-scrollbar {
              width: 22px !important;
              height: 22px !important;
            }
            
            html::-webkit-scrollbar-track {
              background: #f1f5f9 !important;
              border-radius: 12px !important;
            }
            
            html::-webkit-scrollbar-thumb {
              background: #6b7280 !important;
              border-radius: 12px !important;
              border: 3px solid #f1f5f9 !important;
              background-clip: padding-box !important;
            }
            
            html::-webkit-scrollbar-thumb:hover {
              background: #4b5563 !important;
            }
            
            html::-webkit-scrollbar-corner {
              background: #f1f5f9 !important;
            }
            
            @media (prefers-color-scheme: dark) {
              html {
                scrollbar-color: #6b7280 #1f2937 !important;
              }
              
              html::-webkit-scrollbar-track {
                background: #1f2937 !important;
                border-radius: 12px !important;
              }
              
              html::-webkit-scrollbar-thumb {
                background: #6b7280 !important;
                border-radius: 12px !important;
                border: 3px solid #1f2937 !important;
                background-clip: padding-box !important;
              }
              
              html::-webkit-scrollbar-thumb:hover {
                background: #9ca3af !important;
              }
              
              html::-webkit-scrollbar-corner {
                background: #1f2937 !important;
              }
            }
          `
        }} />
        <LangProvider lang={lang}>
          <Providers>
            <TRPCReactProvider>
              <Main lang={lang}>{children}</Main>
            </TRPCReactProvider>
          </Providers>
        </LangProvider>
      </body>
      <GoogleAnalytics gaId={env.GOOGLE_ANALYTICS_ID} />
    </html>
  );
}
