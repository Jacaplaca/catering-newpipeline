import initDashboard from '@root/scripts/init/dashboard';


const updateDashboard = async () => {
    console.log("33 >>> update dashboard...");
    await initDashboard(true);
    return;
}

export default updateDashboard;