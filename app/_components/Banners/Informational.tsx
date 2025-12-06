import translate from '@root/app/lib/lang/translate';
import { Banner, BannerCollapseButton } from "flowbite-react";
import { type FC } from 'react';

const InformationalBanner: FC<{
  children?: React.ReactNode;
  dictionary: Record<string, string>;
  moreInfoUrl?: string;
  text?: string;
}> = ({ children, dictionary, moreInfoUrl, text }) => {
  return (
    <Banner>
      <div className={`flex w-full flex-col items-start justify-between 
        px-4 py-3  
        bg-gray-50 dark:bg-neutral-800 
        md:flex-row md:items-center md:gap-8 lg:py-4`}>
        <div className="sm:flex xl:items-center">
          <i className="fa-solid fa-circle-info mr-3 hidden h-5 w-5 shrink-0 text-primary-600 md:inline" />
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-300 md:mb-0">
            {text ?? children}
          </p>
        </div>
        <div className="flex shrink-0 items-center space-x-4">
          {moreInfoUrl && <a
            href={moreInfoUrl}
            className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500"
          >
            {translate(dictionary, 'shared:learn_more')}
          </a>}
          {/* <Button href="#">Let&apos;s go</Button> */}
          <BannerCollapseButton
            color="gray"
            className="border-0 bg-transparent px-0 text-primary-600 hover:underline enabled:hover:bg-transparent dark:text-primary-500 dark:enabled:hover:text-primary-500 [&>span]:px-0"
          >
            <i className="fa-solid fa-xmark-large " />
          </BannerCollapseButton>
        </div>
      </div>
    </Banner>
  );
}

export default InformationalBanner;
