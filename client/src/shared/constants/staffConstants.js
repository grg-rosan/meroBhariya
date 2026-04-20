// src/admin/staff/staffConstants.js

export const ROLE_STYLES = {
  ADMIN: {
    badge:  'bg-violet-500/10 text-violet-400',
    avatar: 'bg-violet-500/20 text-violet-300',
  },
  DISPATCHER: {
    badge:  'bg-sky-500/10 text-sky-400',
    avatar: 'bg-sky-500/20 text-sky-300',
  },
};

export const ROLE_FILTERS = [
  { value: 'ALL',        label: 'All' },
  { value: 'ADMIN',      label: 'Admins' },
  { value: 'DISPATCHER', label: 'Dispatchers' },
];

export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}