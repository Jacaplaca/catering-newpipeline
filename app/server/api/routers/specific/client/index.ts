import getInfinite from '@root/app/server/api/routers/specific/client/getInfinite';
import count from '@root/app/server/api/routers/specific/client/count';
import deleteOne from '@root/app/server/api/routers/specific/client/deleteOne';
import getMany from '@root/app/server/api/routers/specific/client/getMany';
import edit from '@root/app/server/api/routers/specific/client/edit';
import getFull from '@root/app/server/api/routers/specific/client/getFull';
import getOne from '@root/app/server/api/routers/specific/client/getOne';
import getActiveWithCode from '@root/app/server/api/routers/specific/client/getActiveWithCode';
import activate from '@root/app/server/api/routers/specific/client/activate';
import addClient from '@root/app/server/api/routers/specific/client/addClient';
import removeClient from '@root/app/server/api/routers/specific/client/removeClient';
import getPublic from '@root/app/server/api/routers/specific/client/getPublic';

const clientRouter = {
    getInfinite,
    count,
    deleteOne,
    getMany,
    edit,
    getFull,
    getOne,
    getActiveWithCode,
    activate,
    addClient,
    removeClient,
    getPublic
}

export default clientRouter;
