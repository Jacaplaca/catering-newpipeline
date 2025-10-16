import { resetSettingsToDefault } from '@root/app/server/cache/settings';

const resetConsumerColumnsSettings = async () => {
    console.log("30 >>> resetConsumerColumnsSettings...");
    await resetSettingsToDefault(['table-columns']);
    return;
}

export default resetConsumerColumnsSettings;