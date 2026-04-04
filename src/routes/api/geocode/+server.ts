import { json } from '@sveltejs/kit';
import { searchAddress } from '$lib/api/ban';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';
  const results = await searchAddress(query);
  return json(results);
};
