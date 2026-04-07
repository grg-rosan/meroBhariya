import { Router }           from "express";
import multer               from "multer";
import { requireAuth }      from "../auth/auth.middleware.js";
import { roleMiddleware }   from "../../middlewares/role.middlware.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import * as riderController from "./rider.controller.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.use(requireAuth, roleMiddleware("RIDER"));

router.get  ("/dashboard", riderController.getDashboard);
router.patch("/duty",      riderController.toggleDuty);
router.get  ("/manifest",  riderController.getManifest);
router.post ("/deliver",   riderController.deliverPackage);
router.patch("/location",  riderController.updateLocation);
router.get  ("/earnings",  riderController.getEarnings);
router.get  ("/documents", riderController.getDocuments);
router.post ("/documents", upload.single("file"), riderController.uploadDocument);

export default router;