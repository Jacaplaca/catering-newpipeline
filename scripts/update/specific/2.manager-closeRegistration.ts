import { db } from '@root/app/server/db';

const managerCloseRegistration = async () => {
    console.log("2 >>> managerCloseRegistration...");
    return await db.role.update({
        where: {
            id: "manager"
        },
        data: {
            closeRegistration: true
        }
    })
}

export default managerCloseRegistration;