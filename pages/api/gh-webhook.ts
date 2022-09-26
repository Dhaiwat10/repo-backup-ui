// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { getFilesFromPath, Filelike, Web3Storage } from 'web3.storage';
import fetch from 'node-fetch';
import { supabase } from '../../lib/supabase';
import { getOctokitInstance } from '../../lib/github';

type Data = {
  name: string;
};

const web3StorageClient = new Web3Storage({
  token: process.env.WEB3_STORAGE_TOKEN as string,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  console.log(req.headers['x-github-event']);
  const eventType = req.headers['x-github-event'];

  if (eventType === 'push') {
    const branchName = req.body.ref.split('/').pop();
    const repoOwner = (req.body.repository.owner.login as string).toLowerCase();
    const repoName = (req.body.repository.name as string).toLowerCase();
    const installationId = req.body.installation.id;
    const commitSha = req.body.head_commit.id;

    // create check run
    const octokit = getOctokitInstance(installationId);
    const { data } = await octokit.request(
      'POST /repos/{owner}/{repo}/check-runs',
      {
        owner: repoOwner,
        repo: repoName,
        name: 'Backup',
        head_sha: commitSha,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      }
    );

    const checkRunId = data.id;

    try {
      // TODO: support custom branch names
      if (branchName === 'main' || branchName === 'master') {
        const repoContents = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/zipball`
        );

        const repoBuffer = await repoContents.buffer();
        fs.writeFileSync('./repo.zip', repoBuffer);

        // log the newly created zip file's size in megabytes
        const stats = fs.statSync('./repo.zip');
        const fileSizeInMegabytes = stats.size / 1000000.0;
        console.debug(`repo.zip size: ${fileSizeInMegabytes} MB`);

        const files = await getFilesFromPath('./repo.zip');
        const cid = await web3StorageClient.put(files as Iterable<Filelike>);

        console.log(`Successfully backed up to IPFS: ${cid}`);

        const { error: dbError } = await supabase.from('backups').insert([
          {
            repo_owner: repoOwner,
            repo_name: repoName,
            backup_cid: cid,
            commit_hash: commitSha,
          },
        ]);

        if (dbError) {
          console.error(dbError);
        }

        // mark check run as completed
        await octokit.request(
          'PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}',
          {
            owner: repoOwner,
            repo: repoName,
            check_run_id: checkRunId,
            conclusion: 'success',
            // @ts-expect-error
            status: 'completed',
            completed_at: new Date().toISOString(),
            output: {
              title: 'Backup',
              summary: `Successfully backed up to IPFS: ${cid}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(error);

      // mark check run as failed
      await octokit.request(
        'PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}',
        {
          owner: repoOwner,
          repo: repoName,
          check_run_id: checkRunId,
          conclusion: 'failure',
          // @ts-expect-error
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: {
            title: 'Backup',
            summary: `Failed to backup to IPFS: ${error}`,
          },
        }
      );
    }
  }

  res.status(200).json({ name: 'John Doe' });
}
