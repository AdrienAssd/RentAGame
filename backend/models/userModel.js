const users = [];

module.exports = {
  findByEmail: (email) => users.find(u => u.email === email),
  createUser: (user) => { users.push(user); return user; },
  updatePassword: (email, newPasswordHash) => {
    const user = users.find(u => u.email === email);
    if (user) user.password = newPasswordHash;
  }
};
