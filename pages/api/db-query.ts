// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { repo_name, repo_owner } = req.query;

  const repoName = (repo_name as string).toLowerCase();
  const repoOwner = (repo_owner as string).toLowerCase();

  // search for the repo in the DB
  const { data, error } = await supabase
    .from('backups')
    .select()
    .textSearch('repo_name', repoName)
    .textSearch('repo_owner', repoOwner);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ backups: data });
}
