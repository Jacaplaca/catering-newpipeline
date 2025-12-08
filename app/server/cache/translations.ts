import isObjEmpty from '@root/app/lib/isObjEmpty';
import translate from '@root/app/lib/lang/translate';
import { db } from '@root/app/server/db';
import { i18n } from '@root/i18n-config';
import checkTranslations from '@root/scripts/init/checkTranslations';
import { getDictionary } from '@root/scripts/lib/get-dictionary';
import transformDictionaryJsonToList from '@root/scripts/lib/transformDictionaryJsonToList';


const globalForTranslations = globalThis as unknown as {
    translationsCache: Record<LocaleApp, Record<string, string>> | undefined;
};

const translationsCache: Record<LocaleApp, Record<string, string>> = globalForTranslations.translationsCache ?? i18n.locales.reduce((acc, lang) => {
    acc[lang] = {};
    return acc;
}, {} as Record<LocaleApp, Record<string, string>>);

globalForTranslations.translationsCache = translationsCache;

const getNamesOnly = (translations: Record<string, string>): Record<string, string> => {
    return Object.entries(translations).reduce((acc, [key, value]) => {
        const [, name] = key.split(':') as [string, string];
        acc[name] = value;
        return acc;
    }, {} as Record<string, string>)
};

const refreshTranslationsCache = async () => {
    const translations = await db.translation.findMany({
        where: {}
    }) as {
        lang: LocaleApp;
        name: string;
        value: string;
        group: string;
    }[];
    const translationsObject = translations.reduce((acc, { lang, name, value, group }) => {
        if (!acc[lang]) {
            acc[lang] = {
                [`${group}:${name}`]: value
            };
        } else {
            acc[lang] = {
                ...acc[lang],
                [`${group}:${name}`]: value
            };
        }
        return acc;
    }, {} as Record<LocaleApp, Record<string, string>>);
    i18n.locales.forEach((lang) => {
        translationsCache[lang] = translationsObject[lang];
    });
};

const getTrans = ({ lang, group, name }: {
    lang: LocaleApp;
    group: string;
    name?: string;
}): Record<string, string> => {
    const translations = translationsCache[lang];
    const groupTranslations = Object.entries(translations).reduce((acc, [key, value]) => {
        if (!name) {
            if (key.startsWith(`${group}:`)) {
                acc[key] = value;
            }
        } else {
            if (key === `${group}:${name}`) {
                acc[key] = value;
            }
        }
        return acc;
    }, {} as Record<string, string>);
    return groupTranslations;
};



export const getDict = async ({ lang, keys, key, namesOnly }: { lang: LocaleApp, keys?: string[], key?: string, namesOnly?: boolean }): Promise<Record<string, string>> => {
    if (isObjEmpty(translationsCache[lang])) {
        await refreshTranslationsCache();
    }
    if (!keys && !key) {
        return namesOnly
            ? getNamesOnly(translationsCache[lang])
            : translationsCache[lang];
    }
    const keysArray = keys ?? [];
    if (key) { keysArray.push(key); }
    const groups = keysArray.map(key => {
        const [group, name] = key.split(':') as [string, string?, string?];
        return {
            group,
            name
        };
    });
    const translations = groups.map(({ group, name }) => getTrans({ lang, group, name }));
    const richTranslations = translations.reduce((acc, group) => {
        return { ...acc, ...group };
    }, {} as Record<string, string>);
    return namesOnly ? getNamesOnly(richTranslations) : richTranslations;
};

export const getTranslation = async (lang: LocaleApp, key: string, replacements: string[] = []) => {
    const translation = await getDict({ lang, keys: [key] })
    return translation ? translate(translation, key, replacements) : '';
};

export const throwTranslation = async (lang: LocaleApp, key: string, replacements: string[] = []) => {
    const translation = await getTranslation(lang, key, replacements);
    throw new Error(translation);
};

export const getDefaultTranslations = () => {
    const defaultTranslations = {} as Record<LocaleApp, { group: string, name: string, value: string, lang: string }[]>;
    for (const lang of i18n.locales) {
        const newDictionary = getDictionary(lang);
        const newDictionaryList = transformDictionaryJsonToList(newDictionary, lang);
        defaultTranslations[lang] = newDictionaryList;
    }
    return defaultTranslations;
}

export const addMissingTranslations = async () => {
    const translations = await db.translation.findMany();
    const report = {} as Record<string, Record<string, number>>;
    const defaultTranslations = getDefaultTranslations();
    await Promise.all(Object.entries(defaultTranslations).map(async ([lang, dictionary]) => {
        const currentDictionary = translations.filter((t) => t.lang === lang);
        const reportLang = dictionary.reduce((acc, { group }) => {
            if (acc[group]) {
                acc[group]++;
            } else {
                acc[group] = 1;
            }
            return acc;
        }, {} as Record<string, number>);
        report[lang] = reportLang;
        const freshDictionary = dictionary.filter((item) => {
            const found = currentDictionary.find((t) =>
                t.group === item.group
                && t.name === item.name
            );
            return !found;
        });
        if (freshDictionary.length > 0) {
            await db.translation.createMany({
                data: freshDictionary
            });
        }
    }));
    const result = checkTranslations(report);
    console.log(result);
}

export const cleanupTranslations = async () => {
    const defaultTranslations = getDefaultTranslations();
    const translations = await db.translation.findMany({
        where: {
            NOT: {
                group: 'page'
            }
        }
    });

    // Group translations to delete by language
    const translationsToDelete = translations.filter((translation) => {
        const langTranslations = defaultTranslations[translation.lang as LocaleApp];
        // Check if translation exists in default translations
        return !langTranslations.some((defaultTrans) =>
            defaultTrans.group === translation.group &&
            defaultTrans.name === translation.name
        );
    }).map(t => t.id);

    if (translationsToDelete.length > 0) {
        const deleted = await db.translation.deleteMany({
            where: { id: { in: translationsToDelete } }
        });
        console.log(`Prepared to remove ${translationsToDelete.length} unused translations. Removed ${deleted.count} translations`);
    } else {
        console.log('No unused translations found');
    }
};
