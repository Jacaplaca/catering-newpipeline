import { type Prisma, type PrismaClient } from '@prisma/client';
import { type DefaultArgs } from '@prisma/client/runtime/library';

export type RegularPage = {
  frontmatter: {
    title: string;
    image?: string;
    description?: string;
    meta_title?: string;
    layout?: string;
    draft?: boolean;
    id?: string | number;
    menu?: string;
    type: 'blog' | "page" | 'articles'
  };
  content: string;
  slug?: string;
};

export type Post = {
  frontmatter: {
    title: string;
    meta_title?: string;
    description?: string;
    image?: string;
    categories: string[];
    author: string;
    tags: string[];
    date?: string;
    draft?: boolean;
    id?: string | number;
    slug?: string;
    menu?: string;
  };
  slug?: string;
  content?: string;
};

// export type SlugMap = {
//   [lang: string]: {
//     [folder: string]: {
//       [id: string]: {
//         slug: string;
//         menu: string;
//       }
//     }
//   }
// }

export type Author = {
  frontmatter: {
    title: string;
    image?: string;
    description?: string;
    meta_title?: string;
    socials: {
      facebook: string;
      twitter: string;
      instagram: string;
    };
  };
  content?: string;
  slug?: string;
};

export type Feature = {
  button: button;
  image: string;
  bulletpoints: string[];
  content: string;
  title: string;
};

export type Testimonial = {
  name: string;
  designation: string;
  avatar: string;
  content: string;
};

export type Call_to_action = {
  enable?: boolean;
  title: string;
  description: string;
  image: string;
  button: Button;
};

export type Button = {
  enable: boolean;
  label: string;
  link: string;
};

// declare module "*.svg" {
//   const content: any;
//   export default content;
// }

export interface FooterData {
  company: {
    label: string;
    links: {
      url: string;
      id: string;
      noTranslate?: boolean;
    }[];
  };
  content?: {
    label: string;
    links: {
      url: string;
      id: string;
    }[];
  };
}

export interface DashboardMenuElement {
  label?: string,
  key?: string,
  icon?: string,
  opened?: boolean,
  order: number,
  items: {
    label: string,
    url?: string,
    icon: string,
    order: number,
    key: string
  }[]
}

export type NavElementType = {
  name: string;
  link?: string;
  access: boolean;
}

export type NavProfileElement = NavElementType & { icon?: string, onClick?: () => void }

export type DbObjectType = PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>

export type PagePropsType = {
  title: string
  anchor: string
  description: string
  h1: string
  key: string
  // context: Record<string, unknown>
}

export type ArticlePropsType = PagePropsType & {
  slug: string
  lead: string
  author: string
  date: Date
  group: string
  categories: string[]
  tags: string[]
  fake: boolean
  coverImage: string
}

export type EmailTemplatePropsType = {
  subject: string
  content: string[]
  text: string
  key: string
  language: string
  context: Record<string, unknown>
  senderEmail: string
  senderAlias: string
}

export type ContentContextType = Record<string, string>;

export type TranslationsCache = Record<string, Record<string, string>>;

export type SettingValue = string | number | boolean | Record<string, unknown> | string[] | number[] | null;

export type SettingParsedType = Record<string, SettingValue>;

export type SortOrder = 'asc' | 'desc';

export type TableColumnType = {
  key: string,
  title: string | string[],
  sort?: (by: string) => void,
  align?: 'left' | 'center' | 'right',
  special?: {
    action: () => void,
    icon: string,
    tooltip?: string
  },
  children?: TableColumnType[],
  tooltip?: string
};

export type InputsBulkType<T = string> = {
  label?: string | string[]
  name: T;
  placeholder?: string | string[]
  type: string
  message?: string | string[]
  isTextArea?: boolean,
  isHorizontal?: boolean
  disabled?: boolean
  labelWidth?: string
}

export type TableActionType = {
  label?: string | string[]
  key?: string
  onClick?: () => void
  icon?: string
  isDivider?: boolean,
  hidden?: boolean,
  iconClassName?: string,
  disabled?: boolean
}