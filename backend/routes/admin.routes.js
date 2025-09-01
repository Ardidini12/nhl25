import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import adminAuth from '../middlewares/admin.middleware.js';
import { getAllUsers, updateUser, deleteUser } from '../controllers/admin.controller.js';

const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authorize);
adminRouter.use(adminAuth);

adminRouter.get('/users', getAllUsers);
adminRouter.put('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);

export default adminRouter;


