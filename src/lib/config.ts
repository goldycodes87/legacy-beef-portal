export async function getConfig(): Promise<Record<string, number>> {
  const { getSupabaseAdmin } = await import('@/lib/supabase-admin');
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from('config').select('key, value');

  const result: Record<string, number> = {};
  (data || []).forEach((row: { key: string; value: string }) => {
    result[row.key] = parseFloat(row.value);
  });
  return result;
}

export function getPricePerLb(
  config: Record<string, number>,
  purchaseType: string,
  animalType: string,
  isSplitting: boolean,
  groupSize: number
): number {
  // Whole beef splits always pay whole price regardless of split
  const type = purchaseType === 'half' && isSplitting ? 'half' :
    purchaseType === 'whole' ? 'whole' : purchaseType;
  const key = `price_${type}_${animalType}`;
  return config[key] ?? config[`price_${type}`] ?? 8.00;
}

export function getDepositAmount(
  config: Record<string, number>,
  purchaseType: string,
  isSplitting: boolean,
  groupSize: number
): number {
  if (purchaseType === 'whole' && !isSplitting) return config['deposit_whole_single'] ?? 850;
  if (purchaseType === 'whole' && isSplitting) return config['deposit_whole_split'] ?? 500;
  if (purchaseType === 'half' && isSplitting) return config['deposit_half_split'] ?? 250;
  if (purchaseType === 'half') return config['deposit_half'] ?? 500;
  return config['deposit_quarter'] ?? 250;
}
