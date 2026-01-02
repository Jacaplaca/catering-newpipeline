import initEmpty from '@root/scripts/initEmpty';
import dbUpdate from '@root/scripts/dbUpdate';
// import initSiteMap from '@root/scripts/initSiteMap';

const runPostMigrationSetup = async () => {
    await initEmpty();
    await dbUpdate();
    // await initSiteMap();
}

void runPostMigrationSetup();