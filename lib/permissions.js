// Simple permission model for Maashuka admin

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  STAFF: 'staff',
  VIEWER: 'viewer',
}

export const permissionsByRole = {
  superadmin: ['*'],
  admin: ['products:read', 'products:write', 'orders:read', 'customers:read', 'users:read', 'users:write'],
  staff: ['products:read', 'orders:read', 'customers:read'],
  viewer: ['products:read', 'orders:read'],
}

export function hasPermission(role, permission) {
  if (!role) return false
  const caps = permissionsByRole[role]
  if (!caps) return false
  if (caps.includes('*')) return true
  return caps.includes(permission)
}
