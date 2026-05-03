export const LEAD_STATUSES = {
  new:       { label: 'Baru',      color: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Dihubungi', color: 'bg-yellow-100 text-yellow-700' },
  qualified: { label: 'Kualified', color: 'bg-purple-100 text-purple-700' },
  converted: { label: 'Konversi',  color: 'bg-green-100 text-green-700' },
  lost:      { label: 'Gagal',     color: 'bg-red-100 text-red-700' },
};

export const PROJECT_STATUSES = {
  draft:            { label: 'Draft',              color: 'bg-gray-100 text-gray-700' },
  waiting_approval: { label: 'Menunggu Approval',  color: 'bg-yellow-100 text-yellow-700' },
  approved:         { label: 'Disetujui',          color: 'bg-green-100 text-green-700' },
  rejected:         { label: 'Ditolak',            color: 'bg-red-100 text-red-700' },
};

export const USER_ROLES = {
  sales:   'Sales',
  manager: 'Manager',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'smart_crm_token',
  AUTH_USER:  'smart_crm_user',
};
