const allRoles = {
  Customer: [],
  Admin: ['getUsers', 'manageUsers'],
  Sale: []
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights
};
