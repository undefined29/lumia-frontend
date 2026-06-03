import { UserPermission } from '~/types/user'

export function bitmaskHas(bitmask: number, flag: number): boolean {
  return (bitmask & flag) === flag
}

export function bitmaskSet(bitmask: number, flag: number): number {
  return bitmask | flag
}

export function bitmaskUnset(bitmask: number, flag: number): number {
  return bitmask & ~flag
}

export function bitmaskToggle(bitmask: number, flag: number, on: boolean): number {
  return on ? bitmaskSet(bitmask, flag) : bitmaskUnset(bitmask, flag)
}

export function hasPermission(mask: number, flag: UserPermission): boolean {
  return (mask & flag) !== 0 || (mask & UserPermission.Administrator) !== 0
}

export function isAdministrator(mask: number): boolean {
  return (mask & UserPermission.Administrator) !== 0
}

export function formatPermissionMask(mask: number): string {
  const bits = (mask >>> 0).toString(2).padStart(32, '0')
  return `0b${bits.replace(/(.{4})(?=.)/g, '$1 ')}`
}
