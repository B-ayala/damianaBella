const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getUserByAuthId
} = require('../controllers/userController');

// Ruta de login
router.post('/login', loginUser);

// Ruta para obtener usuario por Supabase Auth ID
router.get('/auth/:userId', getUserByAuthId);

// Rutas CRUD principales
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
