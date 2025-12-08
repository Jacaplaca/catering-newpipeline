import isObjEmpty from '@root/app/lib/isObjEmpty';
import parseSetting from '@root/app/lib/settings/parseSetting';
import stringifySetting from '@root/app/lib/settings/stringifySettings';
import { db } from '@root/app/server/db';
import { getDefaultSetting, getDefaultSettings } from '@root/app/server/lib/defaultSettings';
import { type SettingParsedType, type SettingValue } from '@root/types';


const globalForSettings = globalThis as unknown as {
    settingsCache: Record<string, SettingValue> | undefined;
    settingsGroupsCache: Record<string, Record<string, SettingValue>> | undefined;
    settingsGroupsCacheWithPrivate: Record<string, Record<string, SettingValue>> | undefined;
};

const settingsCache: Record<string, SettingValue> = globalForSettings.settingsCache ?? {};
const settingsGroupsCache: Record<string, Record<string, SettingValue>> = globalForSettings.settingsGroupsCache ?? {};
const settingsGroupsCacheWithPrivate: Record<string, Record<string, SettingValue>> = globalForSettings.settingsGroupsCacheWithPrivate ?? {};

globalForSettings.settingsCache = settingsCache;
globalForSettings.settingsGroupsCache = settingsGroupsCache;
globalForSettings.settingsGroupsCacheWithPrivate = settingsGroupsCacheWithPrivate;

const refreshSettingsCache = async () => {
    const settings = await db.setting.findMany({
        where: {}
    })

    const settingsObject = settings.reduce((acc, { group, name, type, value }) => {
        acc[`${group}:${name}`] = parseSetting({ value, type });
        return acc;
    }, {} as Record<string, SettingValue>);
    const groupsObject = settings.reduce((acc, { access, group, name, type, value }) => {
        if (access !== 'PUBLIC') {
            return acc;
        }
        acc[group] = acc[group] ?? {};
        acc = { ...acc, [group]: { ...acc[group], [name]: parseSetting({ value, type }) } };
        return acc;
    }, {} as Record<string, Record<string, SettingValue>>);
    const groupsObjectWithPrivate = settings.reduce((acc, { group, name, type, value }) => {
        acc[group] = acc[group] ?? {};
        acc = { ...acc, [group]: { ...acc[group], [name]: parseSetting({ value, type }) } };
        return acc;
    }, {} as Record<string, Record<string, SettingValue>>);

    Object.assign(settingsCache, settingsObject);
    Object.assign(settingsGroupsCache, groupsObject);
    Object.assign(settingsGroupsCacheWithPrivate, groupsObjectWithPrivate);
};

//warning: use only on server, this can access PRIVATE settings
export const getSetting = async <T>(group: string, name: string): Promise<T> => {
    const key = `${group}:${name}`;
    if (isObjEmpty(settingsCache) || settingsCache[key] === undefined) {
        await refreshSettingsCache();
    }
    return settingsCache[key] as T;
};

export const getSettingsGroup = async (group: string, withPrivate?: boolean): Promise<SettingParsedType> => {
    if (isObjEmpty(settingsGroupsCache)) {
        await refreshSettingsCache();
    }
    if (withPrivate) {
        return settingsGroupsCacheWithPrivate[group] as SettingParsedType;
    } else {
        return settingsGroupsCache[group] as SettingParsedType;
    }
};

export const updateSetting = async ({
    group,
    name,
    value,
    refreshCache = true,
}: { group: string, name: string, value: SettingValue, refreshCache?: boolean }) => {
    const currentSetting = await db.setting.findFirst({
        where: {
            group,
            name
        }
    })
    if (!currentSetting) {
        const defaultSetting = await getDefaultSetting(group, name);
        if (!defaultSetting) {
            throw new Error('Setting not found');
        }
        await db.setting.create({ data: { ...defaultSetting, value: stringifySetting(value, defaultSetting.type) } });
        if (refreshCache) {
            await refreshSettingsCache();
        }
        return;
    }
    await db.setting.update({
        where: {
            id: currentSetting.id
        },
        data: {
            value: stringifySetting(value, currentSetting.type)
        }
    })
    if (refreshCache) {
        await refreshSettingsCache();
    }
}

export const resetToDefault = async (group: string, name: string) => {
    const defaultSetting = await getDefaultSetting(group, name);
    if (!defaultSetting) {
        throw new Error('Setting not found');
    }

    await db.setting.upsert({
        where: {
            group_name: {
                group,
                name
            }
        },
        create: defaultSetting,
        update: {
            value: defaultSetting.value,
            type: defaultSetting.type,
            access: defaultSetting.access
        }
    });

    await refreshSettingsCache();
}

export const resetSettingsToDefault = async (groups?: string[]) => {
    // If empty array, do nothing
    if (groups && groups.length === 0) {
        return;
    }

    // Get all default settings
    const defaultSettings = await getDefaultSettings();

    // Filter settings by groups if provided
    const settingsToReset = groups
        ? defaultSettings.filter(setting => groups.includes(setting.group))
        : defaultSettings;

    // If no settings found, return
    if (settingsToReset.length === 0) {
        return;
    }

    // Use transaction to ensure all updates are atomic
    await db.$transaction(
        settingsToReset.map((setting) =>
            db.setting.upsert({
                where: {
                    group_name: {
                        group: setting.group,
                        name: setting.name
                    }
                },
                create: setting,
                update: {
                    value: setting.value,
                    type: setting.type,
                    access: setting.access
                }
            })
        )
    );

    await refreshSettingsCache();
}

export const addMissingSettings = async () => {
    // Get all default settings
    const defaultSettings = await getDefaultSettings();

    // Get all existing settings from database
    const existingSettings = await db.setting.findMany();

    // Create a map of existing settings for easier lookup
    const existingSettingsMap = new Map(
        existingSettings.map(setting => [`${setting.group}:${setting.name}`, setting])
    );

    // Filter out settings that don't exist in database
    const missingSettings = defaultSettings.filter(
        setting => !existingSettingsMap.has(`${setting.group}:${setting.name}`)
    );

    // If no missing settings, return early
    if (missingSettings.length === 0) {
        return;
    }

    // Add missing settings in a single transaction
    await db.$transaction(
        missingSettings.map(setting =>
            db.setting.create({
                data: setting
            })
        )
    );

    // Refresh cache after adding new settings
    await refreshSettingsCache();
}
