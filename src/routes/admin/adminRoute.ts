import express from "express";
import { adminAnalytics, monthlyRevenueTrend, rangedRevenue, weeklyRevenueTrend } from "../../controllers/admin/analytics/adminController";
import { UserRoles } from "../../enums/enums";
import { authenticate, authorize } from "../../middlewares/jwtAuthenticationMiddleware";
import { getAllOrderInformation, updateOrderInformation } from "../../controllers/admin/orders/orderManagementController";
import { getCustomerData, viewMoreCustomerData, updateCustomerData, updateViewMoreData } from "../../controllers/admin/customer-mgmt/customerManagementController";

export const adminRoute = express.Router();

adminRoute.get('/analytics', authenticate, authorize([UserRoles.ADMIN]),adminAnalytics);
adminRoute.post('/ranged-revenue', authenticate, authorize([UserRoles.ADMIN]), rangedRevenue);
adminRoute.post('/weekly-revenue', authenticate, authorize([UserRoles.ADMIN]), weeklyRevenueTrend);
adminRoute.post('/monthly-revenue', authenticate, authorize([UserRoles.ADMIN]), monthlyRevenueTrend);
adminRoute.post('/orders', authenticate, authorize([UserRoles.ADMIN]), getAllOrderInformation);
adminRoute.put('/update-order', authenticate, authorize([UserRoles.ADMIN]), updateOrderInformation)
adminRoute.post('/get-users', authenticate, authorize([UserRoles.ADMIN]), getCustomerData);
adminRoute.post('/get-more-data', authenticate, authorize([UserRoles.ADMIN]), viewMoreCustomerData);
adminRoute.put('/update-user-info', authenticate, authorize([UserRoles.ADMIN]), updateCustomerData);
adminRoute.put('/update-qr-info', authenticate, authorize([UserRoles.ADMIN]), updateViewMoreData);