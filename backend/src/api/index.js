import { Router } from 'express';
import auth from './auth.routes.js';
import products from './products.routes.js';
import store from './store.routes.js';
import payments from './payments.routes.js';   // <-- thêm

const api = Router();
api.get('/health', (req,res)=>res.json({status:'ok'}));
api.use('/auth',auth);
api.use('/products',products);
api.use('/orders',payments);                   // <-- thêm (phải nằm TRƯỚC dòng api.use('/',store))
api.use('/',store);
export default api;