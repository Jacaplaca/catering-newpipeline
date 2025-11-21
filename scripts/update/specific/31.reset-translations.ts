import initLang from '@root/scripts/init/lang';

const resetTranslations = async () => {
    console.log("31 >>> resetTranslations...");
    return await initLang(true);
}


export default resetTranslations;