import User from '../models/user.model.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, gamerTag, role } = req.body;

    // Check if the user is trying to change their own role
    const isOwnRoleChange = req.userId === id && req.user.role !== role;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, gamerTag, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // If it's a role change, include a flag to indicate the frontend should refresh
    const responseData = {
      success: true,
      data: user,
      roleChanged: isOwnRoleChange
    };

    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
