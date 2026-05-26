export type InventoryStatus = 'available' | 'sold' | 'reserved' | 'invalid'

export interface InventoryItem {
  id: string
  product_id: string
  company_id: string
  code: string
  status: InventoryStatus
  notes?: string
  reserved_for?: string
  sold_at?: string
  created_at: string
}
