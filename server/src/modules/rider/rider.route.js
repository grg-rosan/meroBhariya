import { Router }           from "express";
import multer               from "multer";
import { requireAuth }      from "../auth/auth.middleware.js";
import { roleMiddleware }   from "../../middlewares/role.middlware.js";
import * as riderController from "./rider.controller.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.use(requireAuth, roleMiddleware("RIDER"));

const DOC_FIELDS = [
  { name: 'CITIZENSHIP_FRONT',    maxCount: 1 },
  { name: 'CITIZENSHIP_BACK',     maxCount: 1 },
  { name: 'DRIVING_LICENSE_FRONT',maxCount: 1 },
  { name: 'VEHICLE_BLUEBOOK',     maxCount: 1 },
  { name: 'RIDER_PHOTO',          maxCount: 1 },
];


router.get  ("/dashboard", riderController.getDashboard);
router.patch("/duty",      riderController.toggleDuty);
router.get  ("/manifest",  riderController.getManifest);
router.post ("/deliver",   riderController.deliverPackage);
router.patch("/location",  riderController.updateLocation);
router.get  ("/earnings",  riderController.getEarnings);
router.get  ("/documents", riderController.getDocuments);
router.post ("/documents", upload.fields(DOC_FIELDS), riderController.uploadDocuments);

export default router;