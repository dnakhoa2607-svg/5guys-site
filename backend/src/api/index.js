import { Router } from 'express';
import auth from './auth.routes.js';
import products from './products.routes.js';
import store from './store.routes.js';
import payments from './payments.routes.js';
import admin from './admin.routes.js';
import support from './support.routes.js';

const api = Router();
api.get('/health', (req,res)=>res.json({status:'ok'}));
api.use('/auth',auth);
api.use('/products',products);
api.use('/admin',admin);
api.use('/support',support);
api.use('/orders',payments);
api.use('/',store);
export default api;
