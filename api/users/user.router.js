const {
  create,
  view,
  updateByParam0,
  deleteByParam0,
  loginWithPassword,
  loginViaToken,
} = require("./user.controller");
const router = require("express").Router();
const { verifyToken } = require("../../auth/token.service");

// post
router.post(`/`, create);
router.post(`/login`, loginWithPassword);
router.post(`/login/secret`, loginViaToken);
// get
router.get(`/`, verifyToken, view);
router.get(`/login/secret`, loginViaToken);
// put
router.put(`/:userid`, verifyToken, updateByParam0);
router.put(`/i/:id`, verifyToken, updateByParam0);
router.put(`/u/:username`, verifyToken, updateByParam0);
// delete
router.delete(`/:userid`, verifyToken, deleteByParam0);
router.delete(`/i/:id`, verifyToken, deleteByParam0);
router.delete(`/u/:username`, verifyToken, deleteByParam0);

module.exports = router;
