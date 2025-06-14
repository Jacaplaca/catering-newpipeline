import { addGroups } from '@root/app/server/lib/dashboardItems';

const addDietsToRoles = async () => {
    console.log("23 >>> Add diets to roles...");
    await addGroups(["diets"], "manager");
    await addGroups(["diets"], "dietician");
}

export default addDietsToRoles;