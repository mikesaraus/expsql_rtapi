const {
  create,
  view,
  updateByParam0,
  deleteByParam0,
  viewSummary,
  viewReport,
} = require("./trans.controller");
const router = require("express").Router();
const { verifyToken } = require("../../auth/token.service");

// post
router.post(`/`, verifyToken, create);
// get
router.get(`/`, verifyToken, view);
router.get(`/summary`, verifyToken, viewSummary);
router.get(`/report`, verifyToken, viewReport);
// put
router.put(`/:trans_id`, verifyToken, updateByParam0);
router.put(`/i/:id`, verifyToken, updateByParam0);
router.put(`/or/:trans_or`, verifyToken, updateByParam0);
router.put(`/ar/:trans_ar`, verifyToken, updateByParam0);
// delete
router.delete(`/:trans_id`, verifyToken, deleteByParam0);
router.delete(`/i/:id`, verifyToken, deleteByParam0);
router.delete(`/or/:trans_or`, verifyToken, deleteByParam0);
router.delete(`/ar/:trans_ar`, verifyToken, deleteByParam0);

module.exports = router;
