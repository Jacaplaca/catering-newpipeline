const specificSettings = {
    "PUBLIC:email:fromAlias:STRING": 'Catering',
    "PUBLIC:main:siteName:STRING": 'Catering',
    "PRIVATE:table-columns:consumer-for-manager:STRING_ARRAY": "code, name, diet.code, diet.dietician.name, diet.description, client.code, client.name, linkCopy, createdAt",
    "PRIVATE:table-columns:consumer-for-dietician:STRING_ARRAY": "code, name, diet.code, diet.description, client.code, client.name, linkCopy, createdAt",
    "PRIVATE:table-columns:consumer-for-client:STRING_ARRAY": "code, name, diet.code, linkCopy, createdAt",
    "PRIVATE:table-columns:order-for-client:STRING_ARRAY": "deliveryDay, status, breakfastStandard, breakfastDietCount, lunchStandard, lunchDietCount, dinnerStandard, dinnerDietCount, sentToCateringAt",
    "PRIVATE:table-columns:order-for-kitchen:STRING_ARRAY": "deliveryDay, status, client.name, client.code, breakfastStandard, breakfastDietCount, lunchStandard, lunchDietCount, dinnerStandard, dinnerDietCount, sentToCateringAt",
    "PRIVATE:table-columns:order-for-manager:STRING_ARRAY": "deliveryDay, status, client.name, client.code, breakfastStandard, breakfastDietCount, lunchStandard, lunchDietCount, dinnerStandard, dinnerDietCount, sentToCateringAt",
    "PRIVATE:admin:email:STRING": "admin@catering.com",
    "PRIVATE:admin:phone:STRING": "+48600000000",
    "PUBLIC:client-files:type:STRING_ARRAY": "menu, checklist, diets", //same as ClientFileType enum in prisma
    "PUBLIC:client-files:s3-prefix:STRING": "client-files",
    "PUBLIC:client-files:max-file-size:NUMBER": 10 * 1024 * 1024, // 10MB w bajtach
    "PUBLIC:main:logoDark:STRING": 'default/ekoplanet_transparent.png',
    "PUBLIC:main:logoLight:STRING": 'default/ekoplanet_transparent.png',
    "PRIVATE:cleanup:order-should-delete:BOOLEAN": false,
    "PRIVATE:cleanup:order-old-months:NUMBER": 2,
    "PRIVATE:cleanup:order-cron:STRING": "37 2 * * 6",
    "PRIVATE:cleanup:menu-should-delete:BOOLEAN": false,
    "PRIVATE:cleanup:menu-old-months:NUMBER": 2,
    "PRIVATE:cleanup:menu-cron:STRING": "47 2 * * 6",
    "PRIVATE:cleanup:client-files-should-delete:BOOLEAN": false,
    "PRIVATE:cleanup:client-files-old-months:NUMBER": 3,
    "PRIVATE:cleanup:client-files-cron:STRING": "58 2 * * 6",
    "PRIVATE:backup:db-should-backup:BOOLEAN": true,
    "PRIVATE:backup:db-cron:STRING": "23 2 * * *",
    "PRIVATE:backup:daily-files-to-keep:NUMBER": 10,
    "PRIVATE:auto-order:should-auto-order:BOOLEAN": true,
    "PRIVATE:auto-order:cron:STRING": "*/5 * * * *",
}

export default specificSettings;