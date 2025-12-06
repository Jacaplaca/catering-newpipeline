'use client'

import Link from 'next/link'
import { type ComponentType, type FunctionComponent } from 'react'
import { type OptionProps, components, type SingleValueProps } from 'react-select'
import Image from 'next/image'
import { api } from "app/trpc/react";
import { i18n, pickerData, type Locale } from '@root/i18n-config'
import Dropdown from '@root/app/_components/ui/Inputs/Dropdown'
import { usePathname, useSearchParams } from 'next/navigation'
import getDefaultPage from '@root/app/lib/url/getDefaultPage'
import splitPathname from '@root/app/lib/url/splitPathname'
import translatePath from '@root/app/lib/url/translatePath'
const { Option, SingleValue } = components

const styles = {
  control: {
    width: 'auto',
  },
  valueContainer: {
    padding: '2px 0px 2px 4px',
    background: 'transparent',
  },
  dropdownIndicator: {
    display: 'none',
  },
  singleValue: {
    borderRadius: '2px',
  },
  menu: {
    background: 'transparent',
    padding: '0px',
  },
  option: {
    padding: '4px 3px',
    background: 'transparent',
  },
}

interface IOption {
  label: string;
  value: string;
  icon: string;
  url: string;
}

const SingleValueCompo = ({ ...props }: SingleValueProps<IOption>) => {
  const { data } = props;
  return (
    // @ts-expect-error - SingleValue
    <SingleValue {...props} >
      {data && <div className='pr-1'>
        <Image
          style={{
            border: "1px solid darkgray",
          }}
          src={data.icon}
          alt="Search x icon"
          width={30}
          height={30}
          priority
        />
      </div>
      }
    </SingleValue>
  );
};

const CustomOption: ComponentType<OptionProps<IOption, false>> = ({ ...props }) => {
  // @ts-expect-error - Option
  return <Option {...props}>
    <Link href={props.data.url} >
      <div className='flex items-center gap-2'>
        <div
          style={{
            border: "1px solid darkgray",
          }}
        >
          <Image
            src={props.data.icon}
            alt="Search x icon"
            width={30}
            height={30}
            priority
          />
        </div>
      </div>
    </Link>
  </Option>
};

const LocaleSwitcher: FunctionComponent<{
  lang: Locale,
  className?: string
}> = ({ lang, className }) => {
  const pathname = usePathname()

  const { langPath, page, rest } = splitPathname(pathname)
  const defaultGroup = getDefaultPage(lang, page ?? '')
  const searchParams = useSearchParams()

  const slugs = api.article.getLangsSlugs.useQuery({
    group: defaultGroup,
    slug: rest[0] ?? '',
    lang
  }, {
    enabled: !!(langPath && defaultGroup && rest[0])
  })

  const slugsObj = slugs.data

  const translatedUrls = Object.entries(pickerData)
    .map(([targetLang, { label, icon }]) => {
      let url = translatePath({
        sourceLocale: lang,
        targetLocale: targetLang as Locale,
        sourcePath: pathname,
        forceLang: true,
        slugs: slugsObj
      })
      const searchParamsString = searchParams.toString()
      if (searchParamsString) {
        url = `${url}?${searchParamsString}`
      }
      return { value: targetLang, label: label[targetLang as LocaleApp], icon, url }
    })

  if (i18n.locales.length <= 1) {
    return null;
  }

  return (
    <div className={className}>
      <Dropdown<IOption>
        options={translatedUrls}
        value={lang}
        onChange={() => { return }}
        comps={{
          Option: CustomOption,
          SingleValue: SingleValueCompo
        }}
        isSearchable={false}
        styles={styles}
      />
    </div>
  )
}


export default LocaleSwitcher